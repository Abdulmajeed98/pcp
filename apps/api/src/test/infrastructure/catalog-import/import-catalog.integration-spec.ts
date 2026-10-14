import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { bearerHeader } from '@pcp/core/test-utils';

import { importCatalog } from '~/infrastructure/catalog-import/import-catalog';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../test-utils/database/test-database';

// A made-up folder shaped like OpenDB, at the pinned commit. Its README says
// what it holds.
const sample = join(__dirname, 'fixtures', 'opendb-sample');

// What one run of the import printed, and the code it ended with.
type Run = { exitCode: number; printed: string[]; errors: string[] };

async function runTheImport(...args: string[]): Promise<Run> {
  const printed: string[] = [];
  const errors: string[] = [];
  const exitCode = await importCatalog(args, {
    log: (line) => printed.push(line),
    error: (line) => errors.push(line),
  });
  return { exitCode, printed, errors };
}

// The report's lines from one heading to the blank line after it.
function linesUnder(heading: string, lines: readonly string[]): string[] {
  const start = lines.indexOf(heading);
  if (start === -1) return [];
  const end = lines.indexOf('', start);
  return lines.slice(start + 1, end === -1 ? undefined : end).map((line) => line.trim());
}

// The report's table: for each Category and in total, the Parts imported,
// those already there, the records left out and the values left out.
function tableIn(lines: readonly string[]): Record<string, number[]> {
  const header = lines.findIndex((line) => line.startsWith('Category '));
  const rows = lines.slice(header + 1, lines.indexOf('', header));
  return Object.fromEntries(
    rows.map((row) => {
      const [name, ...counts] = row.trim().split(/\s+/);
      return [name, counts.map((count) => Number(count.replaceAll(',', '')))];
    }),
  );
}

const pinnedCommit = 'ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf';

type FoundPart = { id: string; name: string };

// A Part as the API answers it.
type ReadPart = {
  id: string;
  openDbId: string | null;
  category: string;
  name: string;
  manufacturer: string;
  partNumbers: string[];
  specifications: Record<string, unknown>;
  missingNeededSpecifications: string[];
};

describe('importing the catalog from a folder shaped like OpenDB', () => {
  let testApp: TestAppWithLogins;
  let adminToken: string;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
    adminToken = await testApp.tokenOf({ roles: ['admin'] });
  });

  afterAll(async () => {
    await testApp.close();
  });

  // Folders a test made, removed after it.
  const copies: string[] = [];

  afterEach(async () => {
    await emptyTheDatabase();
    await Promise.all(copies.splice(0).map((copy) => rm(copy, { recursive: true })));
  });

  // A copy of the sample, for a test to change.
  async function aCopyOfTheSample(): Promise<string> {
    const copy = await mkdtemp(join(tmpdir(), 'opendb-sample-'));
    copies.push(copy);
    await cp(sample, copy, { recursive: true });
    return copy;
  }

  function readPart(partId: string): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/parts/${partId}`, {
      headers: bearerHeader(adminToken),
    });
  }

  async function partsFound(query: Record<string, string>): Promise<FoundPart[]> {
    const response = await fetch(
      `${testApp.baseUrl}/v1/parts?${new URLSearchParams({ size: '100', ...query })}`,
      { headers: bearerHeader(adminToken) },
    );
    expect(response.status).toBe(200);
    return ((await response.json()) as { content: FoundPart[] }).content;
  }

  async function namesFound(query: Record<string, string>): Promise<string[]> {
    return (await partsFound(query)).map((part) => part.name);
  }

  // The one Part a search finds, as the API answers it.
  async function theOnePart(query: Record<string, string>): Promise<ReadPart> {
    const found = await partsFound(query);
    expect(found).toHaveLength(1);
    const response = await readPart(found[0].id);
    expect(response.status).toBe(200);
    return (await response.json()) as ReadPart;
  }

  it('makes a Part of every complete record of each Category, which a search finds', async () => {
    const run = await runTheImport(sample);

    expect(run.errors).toEqual([]);
    expect(run.exitCode).toBe(0);
    expect({
      cpu: await namesFound({ category: 'cpu' }),
      cpuCooler: await namesFound({ category: 'cpuCooler' }),
      motherboard: await namesFound({ category: 'motherboard' }),
      ram: await namesFound({ category: 'ram' }),
      storage: await namesFound({ category: 'storage' }),
      gpu: await namesFound({ category: 'gpu' }),
      case: await namesFound({ category: 'case' }),
      psu: await namesFound({ category: 'psu' }),
    }).toEqual({
      cpu: ['Made-up Ryzen 5 7600', 'Made-up Ryzen 7 7700'],
      cpuCooler: ['Made-up Tower Cooler'],
      motherboard: ['Made-up B650M Board'],
      ram: ['Made-up DDR5 32 GB'],
      storage: ['Made-up NVMe 1 TB'],
      gpu: ['Made-up RX 7600'],
      case: ['Made-up Mesh Tower'],
      psu: ['Made-up 650 W'],
    });

    expect(await theOnePart({ search: 'Made-up Ryzen 5 7600' })).toEqual({
      id: expect.any(String),
      openDbId: '00000000-0000-4000-8000-000000000101',
      category: 'cpu',
      name: 'Made-up Ryzen 5 7600',
      manufacturer: 'AMD',
      partNumbers: expect.any(Array),
      specifications: {
        series: 'Made-up 7000',
        microarchitecture: 'Made-up Arch',
        coreFamily: 'Made-up',
        socket: 'AM5',
        cores: { total: 6, performance: 6, threads: 12 },
        clocks: { performance: { base: 3.8, boost: 5.1 } },
        cache: { l1: '6 x 64 KB', l2: 6, l3: 32 },
        specifications: {
          tdp: 65,
          ppt: 88,
          integratedGraphics: {
            model: 'Made-up Graphics',
            baseClock: 400,
            boostClock: 2200,
            shaderCount: 128,
          },
          eccSupport: false,
          includesCooler: true,
          packaging: 'Boxed',
          lithography: '5 nm',
          simultaneousMultithreading: true,
          memory: { maxSupport: 192, types: ['DDR5'], channels: 2 },
        },
      },
      missingNeededSpecifications: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      photoPath: null,
    });
  });

  it('leaves out a record without a name, without a manufacturer, or whose OpenDB ID is not its file name, and names each', async () => {
    const run = await runTheImport(sample);

    expect(linesUnder('Records left out:', run.printed)).toEqual([
      'CPU/00000000-0000-4000-8000-000000000102.json: it has no manufacturer',
      'CPU/00000000-0000-4000-8000-000000000199.json: its OpenDB ID is not its file name',
      'Motherboard/00000000-0000-4000-8000-000000000302.json: it has no name',
    ]);
    expect(await namesFound({ search: 'Made-up Ryzen 3' })).toEqual([]);
    expect(await namesFound({ search: 'Made-up Ryzen 5 5600' })).toEqual([]);
  });

  it('leaves out and counts a value that does not fit, keeps the rest, and lists a length of 0 among the missing needed specifications', async () => {
    const run = await runTheImport(sample);

    expect(linesUnder('Values left out:', run.printed)).toEqual([
      'cpu, cores.total, not a number: 1',
      'cpuCooler, cpu_sockets, not one of its values: 1',
      'gpu, length, 0, where 0 cannot be true: 1',
    ]);

    const ryzen = await theOnePart({ search: 'Made-up Ryzen 7 7700' });
    expect(ryzen.specifications).toEqual({
      socket: 'AM5',
      cores: { threads: 12 },
      specifications: { tdp: 105, memory: { types: ['DDR5'] } },
    });

    // One socket of three is a variant the set does not hold.
    const cooler = await theOnePart({ category: 'cpuCooler' });
    expect(cooler.specifications.cpu_sockets).toEqual(['AM5', 'LGA 1700']);

    const gpu = await theOnePart({ category: 'gpu' });
    expect(gpu.specifications).not.toHaveProperty('length');
    expect(gpu.missingNeededSpecifications).toEqual(['length']);
  });

  it('imports nothing from a folder that holds no Category, such as Monitor', async () => {
    await runTheImport(sample);

    expect(await namesFound({ search: 'monitor' })).toEqual([]);
  });

  it('combines the part numbers with the manufacturer part numbers among the identifiers, without duplicates, and keeps no barcode or retailer data', async () => {
    await runTheImport(sample);

    const ryzen = await theOnePart({ search: 'Made-up Ryzen 5 7600' });
    expect(ryzen.partNumbers).toEqual(['100-000000001', '100-000000001BOX']);
    // This record lists its part numbers only among its identifiers, once in
    // capitals and once not.
    const gpu = await theOnePart({ category: 'gpu' });
    expect(gpu.partNumbers).toEqual(['MU-RX7600']);

    // The sample's barcodes, retailer listing and store codes.
    for (const part of [ryzen, gpu]) {
      const answer = JSON.stringify(part);
      for (const leftBehind of [
        '0000000000017',
        '0000000000024',
        'made-up-shop',
        '"MU-1"',
        'MADEUP1',
        'example.invalid',
      ]) {
        expect({ leftBehind, kept: answer.includes(leftBehind) }).toEqual({
          leftBehind,
          kept: false,
        });
      }
    }
  });

  it('imports nothing on a second run, and reports every Part as already there', async () => {
    const first = await runTheImport(sample);
    const second = await runTheImport(sample);

    expect(first.printed[0]).toBe(`Read OpenDB at commit ${pinnedCommit}.`);
    expect(tableIn(first.printed)).toEqual({
      cpu: [2, 0, 2, 1],
      cpuCooler: [1, 0, 0, 1],
      motherboard: [1, 0, 1, 0],
      ram: [1, 0, 0, 0],
      storage: [1, 0, 0, 0],
      gpu: [1, 0, 0, 1],
      case: [1, 0, 0, 0],
      psu: [1, 0, 0, 0],
      Total: [9, 0, 3, 3],
    });
    expect(second.exitCode).toBe(0);
    expect(tableIn(second.printed)).toEqual({
      cpu: [0, 2, 2, 0],
      cpuCooler: [0, 1, 0, 0],
      motherboard: [0, 1, 1, 0],
      ram: [0, 1, 0, 0],
      storage: [0, 1, 0, 0],
      gpu: [0, 1, 0, 0],
      case: [0, 1, 0, 0],
      psu: [0, 1, 0, 0],
      Total: [0, 9, 3, 0],
    });
    expect(await partsFound({})).toHaveLength(9);
  });

  it("keeps the Admin's edit through a second run, and an edit leaves the OpenDB ID as it was", async () => {
    await runTheImport(sample);
    const imported = await theOnePart({ category: 'psu' });

    const edit = await fetch(`${testApp.baseUrl}/v1/parts/${imported.id}`, {
      method: 'PUT',
      headers: { ...bearerHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Made-up 650 W, as the Admin names it',
        manufacturer: imported.manufacturer,
        partNumbers: imported.partNumbers,
        specifications: { ...imported.specifications, wattage: 600 },
      }),
    });
    expect(edit.status).toBe(200);
    const edited = (await edit.json()) as ReadPart;
    expect(edited.openDbId).toBe('00000000-0000-4000-8000-000000000801');

    await runTheImport(sample);

    expect(await (await readPart(imported.id)).json()).toEqual(edited);
    expect(await partsFound({ category: 'psu' })).toHaveLength(1);
  });

  it('leaves no Part behind when the database refuses a record partway through', async () => {
    const folder = await aCopyOfTheSample();
    // Enough made-up power supplies that the import writes them in several
    // statements, and after them, the last in the last folder, one that the
    // database refuses: PostgreSQL keeps no NUL character in text.
    const psus = join(folder, 'PSU');
    const madeUp = Array.from(
      { length: 2500 },
      (_, index) => `00000000-0000-4000-8001-${String(index).padStart(12, '0')}`,
    );
    await Promise.all(
      madeUp.map((openDbId, index) =>
        writeFile(
          join(psus, `${openDbId}.json`),
          JSON.stringify({
            opendb_id: openDbId,
            metadata: { name: `Made-up PSU ${index}`, manufacturer: 'Made-up Power' },
          }),
        ),
      ),
    );
    const refused = 'ffffffff-ffff-4fff-bfff-ffffffffffff';
    await writeFile(
      join(psus, `${refused}.json`),
      JSON.stringify({
        opendb_id: refused,
        metadata: { name: 'Made-up PSU \u0000', manufacturer: 'Made-up Power' },
      }),
    );

    const run = await runTheImport(folder);

    expect(run.exitCode).toBe(1);
    expect(run.errors).toEqual([
      expect.stringMatching(
        /^The catalog could not be written, and nothing was imported: /,
      ),
    ]);
    expect(run.printed).toEqual([]);
    expect(await partsFound({})).toEqual([]);
  });

  it('refuses a folder that names another commit, and imports nothing', async () => {
    const folder = await aCopyOfTheSample();
    const another = '0123456789abcdef0123456789abcdef01234567';
    await writeFile(join(folder, 'COMMIT'), `${another}\n`);

    const run = await runTheImport(folder);

    expect(run.exitCode).toBe(1);
    expect(run.errors).toEqual([
      `The source holds OpenDB at commit ${another}, and the import reads only commit ${pinnedCommit}, the last released under ODC-By 1.0. Nothing was imported.`,
    ]);
    expect(run.printed).toEqual([]);
    expect(await partsFound({})).toEqual([]);
  });

  it('refuses a folder that names no commit, and imports nothing', async () => {
    const folder = await aCopyOfTheSample();
    await rm(join(folder, 'COMMIT'));

    const run = await runTheImport(folder);

    expect(run.exitCode).toBe(1);
    expect(run.errors).toEqual([
      `There is no file ${join(folder, 'COMMIT')} that names the commit of OpenDB the folder holds. Nothing was imported.`,
    ]);
    expect(await partsFound({})).toEqual([]);
  });
});
