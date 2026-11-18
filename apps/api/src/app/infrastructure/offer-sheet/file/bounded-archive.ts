import { promisify } from 'node:util';
import { crc32, inflateRaw, type ZlibOptions } from 'node:zlib';

// A zip archive sent by a stranger, unpacked within a bound. An .xlsx file
// is a zip archive, and a crafted one can unpack to far more than any
// library should hold: a file of one megabyte unpacking to a gibibyte took
// the whole process down when ExcelJS read it (`sheet` ticket 01). So the
// parts a reader needs are unpacked here first, with Node's own zlib, each
// stopped as soon as the parts together pass the bound, whatever sizes the
// archive declares; and the reader is handed a new archive of those parts
// alone, stored as they were unpacked, so that it reads nothing that was not
// bounded.

const inflated = promisify<Buffer, ZlibOptions, Buffer>(inflateRaw);

// The signatures of the archive's records.
const endOfDirectory = 0x06054b50;
const directoryEntry = 0x02014b50;
const localHeader = 0x04034b50;

// The ways a part is packed that are read: stored as it is, or deflated.
const stored = 0;
const deflated = 8;

// A part of the archive as its central directory lists it.
type Listed = {
  readonly name: string;
  readonly method: number;
  readonly encrypted: boolean;
  readonly packedSize: number;
  readonly headerAt: number;
};

// Whether a value read from the archive is one of the markers of the zip64
// extension, which an archive of a few megabytes never needs and which is
// not read here.
function isZip64Marker(value: number, bytes: 2 | 4): boolean {
  return value === (bytes === 2 ? 0xffff : 0xffffffff);
}

// The parts the archive's central directory lists, each with a name of its
// own, a leading slash dropped as ExcelJS drops it; or none when the file is
// not a zip archive read here. A reading past the file's end throws, which
// the caller takes as none.
function partsListedIn(file: Buffer): Listed[] | undefined {
  // The end of the central directory: its last record, found from the end,
  // where a comment of up to 65,535 bytes may follow it.
  let end = -1;
  for (let at = file.length - 22; at >= Math.max(0, file.length - 22 - 0xffff); at--) {
    if (file.readUInt32LE(at) === endOfDirectory) {
      end = at;
      break;
    }
  }
  if (end === -1) return undefined;

  const count = file.readUInt16LE(end + 10);
  const directoryAt = file.readUInt32LE(end + 16);
  if (isZip64Marker(count, 2) || isZip64Marker(directoryAt, 4)) return undefined;

  const listed: Listed[] = [];
  const names = new Set<string>();
  let at = directoryAt;
  for (let entry = 0; entry < count; entry++) {
    if (file.readUInt32LE(at) !== directoryEntry) return undefined;
    const flags = file.readUInt16LE(at + 8);
    const method = file.readUInt16LE(at + 10);
    const packedSize = file.readUInt32LE(at + 20);
    const nameLength = file.readUInt16LE(at + 28);
    const extraLength = file.readUInt16LE(at + 30);
    const commentLength = file.readUInt16LE(at + 32);
    const headerAt = file.readUInt32LE(at + 42);
    if (isZip64Marker(packedSize, 4) || isZip64Marker(headerAt, 4)) return undefined;
    if (at + 46 + nameLength > file.length) return undefined;

    const name = file.toString('utf8', at + 46, at + 46 + nameLength).replace(/^\//, '');
    if (names.has(name)) return undefined;
    names.add(name);
    listed.push({ name, method, encrypted: (flags & 1) === 1, packedSize, headerAt });
    at += 46 + nameLength + extraLength + commentLength;
  }
  return listed;
}

// A part's packed bytes, found through its local header, as every reader of
// the format finds them: never past the file's end.
function packedBytesOf(file: Buffer, part: Listed): Buffer | undefined {
  if (file.readUInt32LE(part.headerAt) !== localHeader) return undefined;
  const start =
    part.headerAt +
    30 +
    file.readUInt16LE(part.headerAt + 26) +
    file.readUInt16LE(part.headerAt + 28);
  const finish = start + part.packedSize;
  return finish > file.length ? undefined : file.subarray(start, finish);
}

// The parts of a zip archive whose names are wanted, by name, each
// unpacked, while all of them together unpack to at most `bound` bytes; or
// none, when the file is not a zip archive read here, a wanted part is
// encrypted or packed another way, or the wanted parts unpack past the
// bound. The sizes the archive declares are never read: a deflated part is
// unpacked with Node's zlib told to stop past what is left of the bound.
export async function partsUnpacked(
  file: Uint8Array,
  wanted: (name: string) => boolean,
  bound: number,
): Promise<Map<string, Buffer> | undefined> {
  const bytes = Buffer.from(file.buffer, file.byteOffset, file.byteLength);
  try {
    const listed = partsListedIn(bytes);
    if (listed === undefined) return undefined;

    const parts = new Map<string, Buffer>();
    let left = bound;
    for (const part of listed.filter((each) => wanted(each.name))) {
      const packed = packedBytesOf(bytes, part);
      if (packed === undefined || part.encrypted) return undefined;

      let unpacked: Buffer;
      if (part.method === stored) {
        unpacked = packed;
      } else if (part.method === deflated) {
        // Past the bound, zlib stops and throws a RangeError, taken below.
        unpacked = await inflated(packed, { maxOutputLength: Math.max(1, left) });
      } else {
        return undefined;
      }
      if (unpacked.length > left) return undefined;
      left -= unpacked.length;
      parts.set(part.name, unpacked);
    }
    return parts;
  } catch {
    // A reading past the file's end, a deflated part that is not deflate,
    // or one that unpacks past the bound.
    return undefined;
  }
}

// A zip archive of the parts given, by name, each stored as it is, written
// as the format lays one out.
export function archiveOf(parts: ReadonlyMap<string, Buffer>): Buffer {
  const pieces: Buffer[] = [];
  const directory: Buffer[] = [];
  let offset = 0;
  for (const [name, data] of parts) {
    const nameBytes = Buffer.from(name, 'utf8');
    const checksum = crc32(data);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(localHeader, 0);
    header.writeUInt16LE(10, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(stored, 8);
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    pieces.push(header, nameBytes, data);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(directoryEntry, 0);
    entry.writeUInt16LE(10, 4);
    entry.writeUInt16LE(10, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(stored, 10);
    entry.writeUInt32LE(checksum, 16);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(offset, 42);
    directory.push(entry, nameBytes);

    offset += header.length + nameBytes.length + data.length;
  }

  const directoryBytes = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(endOfDirectory, 0);
  end.writeUInt16LE(parts.size, 8);
  end.writeUInt16LE(parts.size, 10);
  end.writeUInt32LE(directoryBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...pieces, directoryBytes, end]);
}
