import { crc32, deflateSync } from 'node:zlib';

// A small made-up photo: a PNG image of one colour, made here in memory, so
// that no picture is kept in the repository. Each colour makes a different
// file, so a second photo can replace the first.
export function aMadeUpPhoto(
  [red, green, blue]: [number, number, number],
  size = 16,
): { name: string; mimeType: string; buffer: Buffer } {
  // Each line of the image starts with its filter, 0 for none, and holds
  // three bytes for each pixel.
  const line = Buffer.concat([
    Buffer.from([0]),
    Buffer.from(Array.from({ length: size }, () => [red, green, blue]).flat()),
  ]);
  const pixels = Buffer.concat(Array.from({ length: size }, () => line));

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  // 8 bits a channel, colour type 2 (red, green and blue), and the
  // compression, filter and interlace methods PNG defines.
  header.set([8, 2, 0, 0, 0], 8);

  const buffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  return { name: 'made-up-photo.png', mimeType: 'image/png', buffer };
}

// One chunk of a PNG file: its length, its type, its data, and the checksum
// of its type and data.
function chunk(type: string, data: Buffer): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));

  return Buffer.concat([length, typeAndData, checksum]);
}
