import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { bearerHeader } from '@pcp/core/test-utils';
import { create, Pax } from 'tar';

import { importCatalog } from '~/infrastructure/catalog-import/import-catalog';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../test-utils/database/test-database';
import { aPortWhereNothingListens } from '../../test-utils/network';

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

// An archive of a folder shaped like OpenDB, made as GitHub makes the archive
// of a commit: the folder's content under `buildcores-open-db-<commit>/open-db`,
// after a first header that names the commit, as `git archive` writes it. With
// no commit, the archive names none.
async function anArchiveOf(folder: string, commit?: string): Promise<Buffer> {
  const entries: Buffer[] = [];
  for await (const chunk of create(
    {
      cwd: folder,
      prefix: `buildcores-open-db-${commit ?? 'unknown'}/open-db`,
      portable: true,
    },
    await readdir(folder),
  )) {
    entries.push(chunk as Buffer);
  }
  const header = commit === undefined ? [] : [new Pax({ comment: commit }, true).encode()];
  return gzipSync(Buffer.concat([...header, ...entries]));
}

// What stands in for GitHub. It answers every request with the archive and the
// status it is given, and keeps the path of each request.
type GitHubStandIn = {
  repository: string;
  archive: Buffer;
  status: number;
  requested: string[];
  close(): Promise<void>;
};

async function startGitHubStandIn(): Promise<GitHubStandIn> {
  const server = createServer((request, response) => {
    standIn.requested.push(request.url ?? '');
    response.writeHead(standIn.status, { 'content-type': 'application/x-gzip' });
    response.end(standIn.status === 200 ? standIn.archive : undefined);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const standIn: GitHubStandIn = {
    repository: `http://127.0.0.1:${port}/buildcores/buildcores-open-db`,
    archive: Buffer.alloc(0),
    status: 200,
    requested: [],
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
  return standIn;
}

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

  it('makes a Part of each record that has an OpenDB ID, a name and a manufacturer, which a search finds', async () => {
    const run = await runTheImport(sample);

    expect(run.errors).toEqual([]);
    expect(run.exitCode).toBe(0);
    expect(await namesFound({})).toEqual([
      'Made-up 650 W',
      'Made-up B650M Board',
      'Made-up DDR5 32 GB',
      'Made-up Mesh Tower',
      'Made-up NVMe 1 TB',
      'Made-up RX 7600',
      'Made-up Ryzen 5 7600',
      'Made-up Ryzen 7 7700',
      'Made-up Tower Cooler',
    ]);

    // One complete record in full.
    expect(await theOnePart({ search: 'Made-up Ryzen 5 7600' })).toEqual({
      id: expect.any(String),
      openDbId: '00000000-0000-4000-8000-000000000101',
      category: 'cpu',
      name: 'Made-up Ryzen 5 7600',
      manufacturer: 'AMD',
      partNumbers: ['100-000000001', '100-000000001BOX'],
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

    // A complete record of each other Category, as the parts of it a Part
    // keeps.
    const kept = (part: ReadPart) => ({
      openDbId: part.openDbId,
      category: part.category,
      manufacturer: part.manufacturer,
      specifications: part.specifications,
      missingNeededSpecifications: part.missingNeededSpecifications,
    });
    expect(kept(await theOnePart({ search: 'Made-up B650M Board' }))).toEqual({
      openDbId: '00000000-0000-4000-8000-000000000301',
      category: 'motherboard',
      manufacturer: 'Made-up Boards',
      specifications: {
        socket: 'AM5',
        form_factor: 'Micro ATX',
        chipset: 'B650',
        memory: { max: 192, ram_type: 'DDR5', slots: 4 },
        pcie_slots: [{ gen: '4.0', quantity: 1, lanes: 16 }],
        m2_slots: [{ size: '2280', key: 'M', interface: 'PCIe 4.0 x4' }],
        storage_devices: { sata_6_gb_s: 4, sata_3_gb_s: 0, u2: 0 },
        power_connectors: { main_power: '24-pin', cpu_power: ['8-pin'] },
        back_connect_connectors: false,
      },
      missingNeededSpecifications: [],
    });
    expect(kept(await theOnePart({ search: 'Made-up DDR5 32 GB' }))).toEqual({
      openDbId: '00000000-0000-4000-8000-000000000401',
      category: 'ram',
      manufacturer: 'Made-up Memory',
      specifications: {
        ram_type: 'DDR5',
        modules: { quantity: 2, capacity_gb: 16 },
        capacity: 32,
        speed: 6000,
      },
      missingNeededSpecifications: [],
    });
    expect(kept(await theOnePart({ search: 'Made-up NVMe 1 TB' }))).toEqual({
      openDbId: '00000000-0000-4000-8000-000000000501',
      category: 'storage',
      manufacturer: 'Made-up Storage',
      specifications: {
        interface: 'M.2 PCIe 4.0 x4',
        form_factor: 'M.2-2280',
        storage_type: 'SSD',
        capacity: 1000,
        nvme: true,
      },
      missingNeededSpecifications: [],
    });
    expect(kept(await theOnePart({ search: 'Made-up Mesh Tower' }))).toEqual({
      openDbId: '00000000-0000-4000-8000-000000000701',
      category: 'case',
      manufacturer: 'Made-up Cases',
      specifications: {
        form_factor: 'Micro ATX Mini Tower',
        supported_motherboard_form_factors: ['Micro ATX', 'Mini-ITX'],
        max_video_card_length: 338,
        expansion_slots: 4,
        internal_3_5_bays: 2,
        internal_2_5_bays: 2,
        max_cpu_cooler_height: 170,
        supported_power_supply_form_factors: ['ATX'],
        max_psu_length: 180,
        supports_rear_connecting_motherboard: false,
      },
      missingNeededSpecifications: [],
    });
    expect(kept(await theOnePart({ search: 'Made-up 650 W' }))).toEqual({
      openDbId: '00000000-0000-4000-8000-000000000801',
      category: 'psu',
      manufacturer: 'Made-up Power',
      specifications: {
        wattage: 650,
        form_factor: 'ATX',
        length: 140,
        connectors: {
          atx_24_pin: 1,
          eps_8_pin: 2,
          pcie_6_plus_2_pin: 2,
          pcie_12vhpwr: 0,
          sata: 6,
          molex_4_pin: 2,
          floppy_4_pin: 0,
        },
      },
      missingNeededSpecifications: [],
    });
    // The cooler and the GPU each hold a value that does not fit, which the
    // next tests are about.
    expect(kept(await theOnePart({ search: 'Made-up Tower Cooler' }))).toEqual({
      openDbId: '00000000-0000-4000-8000-000000000201',
      category: 'cpuCooler',
      manufacturer: 'Made-up Cooling',
      specifications: {
        water_cooled: false,
        height: 155,
        fan_quantity: 1,
        color: ['BLACK'],
      },
      missingNeededSpecifications: ['cpu_sockets'],
    });
    expect(kept(await theOnePart({ search: 'Made-up RX 7600' }))).toEqual({
      openDbId: '00000000-0000-4000-8000-000000000601',
      category: 'gpu',
      manufacturer: 'Made-up Graphics',
      specifications: {
        chipset: 'Made-up 7600',
        total_slot_width: 2,
        tdp: 165,
        power_connectors: {
          pcie_6_pin: 0,
          pcie_8_pin: 1,
          pcie_12VHPWR: 0,
          pcie_12V_2x6: 0,
        },
      },
      missingNeededSpecifications: ['length'],
    });
  });

  it('leaves out a record that is not JSON, has no OpenDB ID that is its file name or that another record has, or has no name or manufacturer, and names each', async () => {
    const run = await runTheImport(sample);

    expect(linesUnder('Records left out:', run.printed)).toEqual([
      'CPU/00000000-0000-4000-8000-000000000102.json: it has no manufacturer',
      'CPU/00000000-0000-4000-8000-000000000199.json: its OpenDB ID is not its file name',
      'Motherboard/00000000-0000-4000-8000-000000000302.json: it has no name',
      'RAM/made-up-ram.json: it has no OpenDB ID that is a UUID',
      'Storage/00000000-0000-4000-8000-000000000502.json: it holds no JSON record',
      'PSU/00000000-0000-4000-8000-000000000101.json: another record has its OpenDB ID',
    ]);
    expect(await namesFound({ search: 'Made-up Ryzen 3' })).toEqual([]);
    expect(await namesFound({ search: 'Made-up Ryzen 5 5600' })).toEqual([]);
    expect(await namesFound({ search: 'Made-up DDR4' })).toEqual([]);
    expect(await namesFound({ search: 'Made-up 750 W' })).toEqual([]);
  });

  it('leaves out and counts a value that does not fit, keeps the rest, and lists a length of 0 among the missing needed specifications', async () => {
    const run = await runTheImport(sample);

    expect(linesUnder('Values left out:', run.printed)).toEqual([
      'cpu, cores.total, not a number: 1',
      'cpuCooler, cpu_sockets, not one of its values: 1',
      'gpu, length, 0, where 0 cannot be true: 1',
      'case, dimensions_mm, not a group of values: 1',
    ]);

    const ryzen = await theOnePart({ search: 'Made-up Ryzen 7 7700' });
    expect(ryzen.specifications).toEqual({
      socket: 'AM5',
      cores: { threads: 12 },
      specifications: { tdp: 105, memory: { types: ['DDR5'] } },
    });

    // One socket of three is a variant the set does not hold. The list is
    // left out whole, so that a rule says it could not check rather than
    // that a CPU on a socket the list leaves unnamed does not fit.
    const cooler = await theOnePart({ search: 'Made-up Tower Cooler' });
    expect(cooler.specifications).not.toHaveProperty('cpu_sockets');
    expect(cooler.missingNeededSpecifications).toEqual(['cpu_sockets']);

    const gpu = await theOnePart({ search: 'Made-up RX 7600' });
    expect(gpu.specifications).not.toHaveProperty('length');
    expect(gpu.missingNeededSpecifications).toEqual(['length']);

    // Its dimensions were given as text, where a group of values belongs.
    const tower = await theOnePart({ search: 'Made-up Mesh Tower' });
    expect(tower.specifications).not.toHaveProperty('dimensions_mm');
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
    const gpu = await theOnePart({ search: 'Made-up RX 7600' });
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
      ram: [1, 0, 1, 0],
      storage: [1, 0, 1, 0],
      gpu: [1, 0, 0, 1],
      case: [1, 0, 0, 1],
      psu: [1, 0, 1, 0],
      Total: [9, 0, 6, 4],
    });
    expect(second.exitCode).toBe(0);
    expect(tableIn(second.printed)).toEqual({
      cpu: [0, 2, 2, 0],
      cpuCooler: [0, 1, 0, 0],
      motherboard: [0, 1, 1, 0],
      ram: [0, 1, 1, 0],
      storage: [0, 1, 1, 0],
      gpu: [0, 1, 0, 0],
      case: [0, 1, 0, 0],
      psu: [0, 1, 1, 0],
      Total: [0, 9, 6, 0],
    });
    expect(await partsFound({})).toHaveLength(9);
  });

  it("keeps the Admin's edit through a second run, and an edit leaves the OpenDB ID as it was", async () => {
    await runTheImport(sample);
    const imported = await theOnePart({ search: 'Made-up 650 W' });

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

  it('leaves no Part behind when the database refuses a record partway through, and names the record', async () => {
    const folder = await aCopyOfTheSample();
    // The power supply is the last Part written, after the Parts of every
    // other folder. PostgreSQL keeps no NUL character in text.
    const psu = join(folder, 'PSU', '00000000-0000-4000-8000-000000000801.json');
    const record = JSON.parse(await readFile(psu, 'utf8')) as {
      metadata: { name: string };
    };
    record.metadata.name = 'Made-up 650 W \u0000';
    await writeFile(psu, JSON.stringify(record));

    const run = await runTheImport(folder);

    expect(run.exitCode).toBe(1);
    expect(run.errors).toEqual([
      'The catalog could not be written, and nothing was imported: the record with OpenDB ID 00000000-0000-4000-8000-000000000801 was not taken: invalid byte sequence for encoding "UTF8": 0x00',
    ]);
    expect(run.printed).toEqual([]);
    expect(await partsFound({})).toEqual([]);
  });

  it('refuses a folder that lacks one of the eight folders, and imports nothing', async () => {
    const folder = await aCopyOfTheSample();
    await rm(join(folder, 'PSU'), { recursive: true });

    const run = await runTheImport(folder);

    expect(run.exitCode).toBe(1);
    expect(run.errors).toEqual([
      'The source has no PSU folder, so it is not shaped like OpenDB. Nothing was imported.',
    ]);
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

  it('says so plainly when the database cannot be reached, and imports nothing', async () => {
    const database = process.env.DATASOURCE_URL;
    process.env.DATASOURCE_URL = `postgresql://127.0.0.1:${await aPortWhereNothingListens()}/pcp`;
    let run: Run;
    try {
      run = await runTheImport(sample);
    } finally {
      process.env.DATASOURCE_URL = database;
    }

    expect(run.exitCode).toBe(1);
    expect(run.errors).toEqual([
      expect.stringMatching(
        /^The database could not be reached, and nothing was imported: .*ECONNREFUSED/,
      ),
    ]);
    expect(run.printed).toEqual([]);
    expect(await partsFound({})).toEqual([]);
  });

  describe('from GitHub, when no folder is given', () => {
    let gitHub: GitHubStandIn;
    const archivePath = `/buildcores/buildcores-open-db/archive/${pinnedCommit}.tar.gz`;

    beforeAll(async () => {
      gitHub = await startGitHubStandIn();
      process.env.OPENDB_REPOSITORY_URL = gitHub.repository;
    });

    afterAll(async () => {
      delete process.env.OPENDB_REPOSITORY_URL;
      await gitHub.close();
    });

    beforeEach(() => {
      gitHub.requested = [];
      gitHub.status = 200;
    });

    it("fetches the pinned commit's archive and imports its eight folders", async () => {
      gitHub.archive = await anArchiveOf(sample, pinnedCommit);

      const run = await runTheImport();

      expect(run.errors).toEqual([]);
      expect(run.exitCode).toBe(0);
      expect(gitHub.requested).toEqual([archivePath]);
      expect(run.printed[0]).toBe(`Read OpenDB at commit ${pinnedCommit}.`);
      expect(tableIn(run.printed).Total).toEqual([9, 0, 6, 4]);
      expect(await partsFound({})).toHaveLength(9);
      expect(await namesFound({ search: 'monitor' })).toEqual([]);
    });

    it('refuses an archive that holds another commit, and imports nothing', async () => {
      const another = '0123456789abcdef0123456789abcdef01234567';
      gitHub.archive = await anArchiveOf(sample, another);

      const run = await runTheImport();

      expect(run.exitCode).toBe(1);
      expect(run.errors).toEqual([
        `The source holds OpenDB at commit ${another}, and the import reads only commit ${pinnedCommit}, the last released under ODC-By 1.0. Nothing was imported.`,
      ]);
      expect(await partsFound({})).toEqual([]);
    });

    it('refuses an archive that does not say which commit it holds, and imports nothing', async () => {
      gitHub.archive = await anArchiveOf(sample);

      const run = await runTheImport();

      expect(run.exitCode).toBe(1);
      expect(run.errors).toEqual([
        `The archive fetched from ${gitHub.repository}/archive/${pinnedCommit}.tar.gz does not say which commit of OpenDB it holds. Nothing was imported.`,
      ]);
      expect(await partsFound({})).toEqual([]);
    });

    it('says so plainly when GitHub answers with an error, and leaves the catalog as it was', async () => {
      await runTheImport(sample);
      const before = await partsFound({});
      gitHub.status = 503;

      const run = await runTheImport();

      expect(run.exitCode).toBe(1);
      expect(run.errors).toEqual([
        `GitHub answered 503 when asked for ${gitHub.repository}/archive/${pinnedCommit}.tar.gz. Nothing was imported.`,
      ]);
      expect(await partsFound({})).toEqual(before);
    });

    it('says so plainly when GitHub cannot be reached, and leaves the catalog as it was', async () => {
      await runTheImport(sample);
      const before = await partsFound({});
      const nowhere = `http://127.0.0.1:${await aPortWhereNothingListens()}/buildcores/buildcores-open-db`;
      process.env.OPENDB_REPOSITORY_URL = nowhere;
      let run: Run;
      try {
        run = await runTheImport();
      } finally {
        process.env.OPENDB_REPOSITORY_URL = gitHub.repository;
      }

      expect(run.exitCode).toBe(1);
      expect(run.errors).toEqual([
        expect.stringMatching(
          new RegExp(
            `^GitHub could not be reached to fetch ${nowhere}/archive/${pinnedCommit}\\.tar\\.gz: .*ECONNREFUSED.*\\. Nothing was imported\\.$`,
          ),
        ),
      ]);
      expect(await partsFound({})).toEqual(before);
    });
  });
});
