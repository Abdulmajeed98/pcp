import type {
  Build,
  PartAndQuantity,
  StorageInterface,
  StorageSpecifications,
} from '../../index';
import { outcomeOf } from '../outcome-of';

// A drive of an interface, of which the Build holds `quantity`.
function drive(
  id: string,
  iface: StorageInterface | undefined,
  quantity = 1,
): PartAndQuantity<StorageSpecifications> {
  return { id, quantity, specifications: { interface: iface } };
}

function boardWithPorts(
  sata6: number | undefined,
  sata3: number | undefined,
): Build['motherboard'] {
  return {
    id: 'the-board',
    specifications: { storage_devices: { sata_6_gb_s: sata6, sata_3_gb_s: sata3 } },
  };
}

describe("rule 13: the SATA drives and the motherboard's SATA ports", () => {
  it('passes fewer SATA drives than the motherboard has SATA ports', () => {
    const build: Build = {
      motherboard: boardWithPorts(4, 0),
      storage: [drive('the-drive', 'SATA 6.0 Gb/s')],
    };

    expect(outcomeOf(13, build)).toEqual({
      rule: 13,
      outcome: 'passes',
      parts: ['the-board', 'the-drive'],
    });
  });

  it('finds a Problem in more SATA drives than the motherboard has SATA ports', () => {
    const build: Build = {
      motherboard: boardWithPorts(1, 0),
      storage: [drive('an-ssd', 'SATA 6.0 Gb/s'), drive('a-hard-drive', 'SATA 3.0 Gb/s')],
    };

    expect(outcomeOf(13, build)).toEqual({
      rule: 13,
      outcome: 'problem',
      parts: ['the-board', 'an-ssd', 'a-hard-drive'],
    });
  });

  it("passes as many SATA drives as the motherboard's SATA ports of both speeds", () => {
    const build: Build = {
      motherboard: boardWithPorts(2, 2),
      storage: [
        drive('two-ssds', 'SATA 6.0 Gb/s', 2),
        drive('two-hard-drives', 'SATA 3.0 Gb/s', 2),
      ],
    };

    expect(outcomeOf(13, build)).toEqual({
      rule: 13,
      outcome: 'passes',
      parts: ['the-board', 'two-ssds', 'two-hard-drives'],
    });
  });

  it("finds a Problem in one SATA drive more than the motherboard's SATA ports, naming every SATA drive", () => {
    const build: Build = {
      motherboard: boardWithPorts(2, 2),
      storage: [
        drive('two-ssds', 'SATA 6.0 Gb/s', 2),
        drive('two-hard-drives', 'SATA 3.0 Gb/s', 2),
        drive('an-old-drive', 'SATA 1.5 Gb/s'),
      ],
    };

    expect(outcomeOf(13, build)).toEqual({
      rule: 13,
      outcome: 'problem',
      parts: ['the-board', 'two-ssds', 'two-hard-drives', 'an-old-drive'],
    });
  });

  it("is unchecked when the motherboard's SATA 6 Gb/s ports are missing", () => {
    const build: Build = {
      motherboard: boardWithPorts(undefined, 0),
      storage: [drive('the-drive', 'SATA 6.0 Gb/s')],
    };

    expect(outcomeOf(13, build)).toEqual({
      rule: 13,
      outcome: 'unchecked',
      missing: [{ part: 'the-board', path: 'storage_devices.sata_6_gb_s' }],
    });
  });

  it.each<[StorageInterface]>([
    ['M.2 SATA'],
    ['mSATA'],
    ['SAS 12.0 Gb/s'],
    ['U.2'],
    ['M.2 PCIe 4.0 x4'],
    ['PATA 100'],
  ])('does not count a drive whose interface is %s as a SATA drive', (iface) => {
    const build: Build = {
      motherboard: boardWithPorts(1, 0),
      storage: [drive('a-sata-drive', 'SATA 6.0 Gb/s'), drive('the-other-drive', iface)],
    };

    expect(outcomeOf(13, build)).toEqual({
      rule: 13,
      outcome: 'passes',
      parts: ['the-board', 'a-sata-drive', 'the-other-drive'],
    });
  });

  it('counts two of one drive as two drives', () => {
    const build: Build = {
      motherboard: boardWithPorts(1, 0),
      storage: [drive('two-ssds', 'SATA 6.0 Gb/s', 2)],
    };

    expect(outcomeOf(13, build)).toEqual({
      rule: 13,
      outcome: 'problem',
      parts: ['the-board', 'two-ssds'],
    });
  });

  describe('unchecked only when it matters', () => {
    it('is unchecked when a drive whose interface is missing could tip the count', () => {
      const build: Build = {
        motherboard: boardWithPorts(1, 0),
        storage: [
          drive('a-sata-drive', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-interface', undefined),
        ],
      };

      expect(outcomeOf(13, build)).toEqual({
        rule: 13,
        outcome: 'unchecked',
        missing: [{ part: 'a-drive-of-no-interface', path: 'interface' }],
      });
    });

    it('judges a drive whose interface is missing when it could not tip the count', () => {
      const build: Build = {
        motherboard: boardWithPorts(2, 0),
        storage: [
          drive('a-sata-drive', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-interface', undefined),
        ],
      };

      expect(outcomeOf(13, build)).toEqual({
        rule: 13,
        outcome: 'passes',
        parts: ['the-board', 'a-sata-drive', 'a-drive-of-no-interface'],
      });
    });

    it('finds a Problem the known SATA drives prove beside a drive whose interface is missing, naming the known ones', () => {
      const build: Build = {
        motherboard: boardWithPorts(1, 0),
        storage: [
          drive('two-ssds', 'SATA 6.0 Gb/s', 2),
          drive('a-drive-of-no-interface', undefined),
        ],
      };

      expect(outcomeOf(13, build)).toEqual({
        rule: 13,
        outcome: 'problem',
        parts: ['the-board', 'two-ssds'],
      });
    });

    it("passes a Build with no SATA drive whatever the motherboard's SATA ports", () => {
      const build: Build = {
        motherboard: boardWithPorts(undefined, undefined),
        storage: [
          drive('an-nvme-drive', 'M.2 PCIe 4.0 x4'),
          drive('an-m2-sata-drive', 'M.2 SATA'),
        ],
      };

      expect(outcomeOf(13, build)).toEqual({
        rule: 13,
        outcome: 'passes',
        parts: ['the-board', 'an-nvme-drive', 'an-m2-sata-drive'],
      });
    });

    it('passes the SATA drives that the 6 Gb/s ports take, whatever the missing 3 Gb/s ports', () => {
      const build: Build = {
        motherboard: boardWithPorts(2, undefined),
        storage: [drive('two-ssds', 'SATA 6.0 Gb/s', 2)],
      };

      expect(outcomeOf(13, build)).toEqual({
        rule: 13,
        outcome: 'passes',
        parts: ['the-board', 'two-ssds'],
      });
    });

    it('is unchecked when the 3 Gb/s ports are missing and the 6 Gb/s ports take too few', () => {
      const build: Build = {
        motherboard: boardWithPorts(2, undefined),
        storage: [drive('three-ssds', 'SATA 6.0 Gb/s', 3)],
      };

      expect(outcomeOf(13, build)).toEqual({
        rule: 13,
        outcome: 'unchecked',
        missing: [{ part: 'the-board', path: 'storage_devices.sata_3_gb_s' }],
      });
    });

    it("is unchecked, naming the motherboard's ports first, when they and a drive's interface are missing", () => {
      const build: Build = {
        motherboard: boardWithPorts(undefined, 0),
        storage: [
          drive('a-sata-drive', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-interface', undefined),
        ],
      };

      expect(outcomeOf(13, build)).toEqual({
        rule: 13,
        outcome: 'unchecked',
        missing: [
          { part: 'the-board', path: 'storage_devices.sata_6_gb_s' },
          { part: 'a-drive-of-no-interface', path: 'interface' },
        ],
      });
    });
  });
});
