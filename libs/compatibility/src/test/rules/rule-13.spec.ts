import type { Build, StorageFormFactor, StorageInterface } from '../../index';
import { drive } from '../made-up-parts';
import { outcomeOf } from '../outcome-of';

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
      storage: [drive('the-drive', '2.5"', 'SATA 6.0 Gb/s')],
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
      storage: [
        drive('an-ssd', '2.5"', 'SATA 6.0 Gb/s'),
        drive('a-hard-drive', '3.5"', 'SATA 3.0 Gb/s'),
      ],
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
        drive('two-ssds', '2.5"', 'SATA 6.0 Gb/s', 2),
        drive('two-hard-drives', '3.5"', 'SATA 3.0 Gb/s', 2),
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
        drive('two-ssds', '2.5"', 'SATA 6.0 Gb/s', 2),
        drive('two-hard-drives', '3.5"', 'SATA 3.0 Gb/s', 2),
        drive('an-old-drive', '3.5"', 'SATA 1.5 Gb/s'),
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
      storage: [drive('the-drive', '2.5"', 'SATA 6.0 Gb/s')],
    };

    expect(outcomeOf(13, build)).toEqual({
      rule: 13,
      outcome: 'unchecked',
      missing: [{ part: 'the-board', path: 'storage_devices.sata_6_gb_s' }],
    });
  });

  it.each<[StorageInterface, StorageFormFactor]>([
    ['M.2 SATA', 'M.2-2280'],
    ['mSATA', 'mSATA'],
    ['SAS 12.0 Gb/s', '3.5"'],
    ['U.2', '2.5"'],
    ['M.2 PCIe 4.0 x4', 'M.2-2280'],
    ['PATA 100', '3.5"'],
  ])(
    'does not count a drive whose interface is %s as a SATA drive',
    (iface, formFactor) => {
      const build: Build = {
        motherboard: boardWithPorts(1, 0),
        storage: [
          drive('a-sata-drive', '2.5"', 'SATA 6.0 Gb/s'),
          drive('the-other-drive', formFactor, iface),
        ],
      };

      expect(outcomeOf(13, build)).toEqual({
        rule: 13,
        outcome: 'passes',
        parts: ['the-board', 'a-sata-drive', 'the-other-drive'],
      });
    },
  );

  it('counts two of one drive as two drives', () => {
    const build: Build = {
      motherboard: boardWithPorts(1, 0),
      storage: [drive('two-ssds', '2.5"', 'SATA 6.0 Gb/s', 2)],
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
          drive('a-sata-drive', '2.5"', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-interface', '2.5"', undefined),
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
          drive('a-sata-drive', '2.5"', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-interface', '2.5"', undefined),
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
          drive('two-ssds', '2.5"', 'SATA 6.0 Gb/s', 2),
          drive('a-drive-of-no-interface', '2.5"', undefined),
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
          drive('an-nvme-drive', 'M.2-2280', 'M.2 PCIe 4.0 x4'),
          drive('an-m2-sata-drive', 'M.2-2280', 'M.2 SATA'),
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
        storage: [drive('two-ssds', '2.5"', 'SATA 6.0 Gb/s', 2)],
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
        storage: [drive('three-ssds', '2.5"', 'SATA 6.0 Gb/s', 3)],
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
          drive('a-sata-drive', '2.5"', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-interface', '2.5"', undefined),
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
