import type {
  Build,
  M2SlotKey,
  PartAndQuantity,
  StorageFormFactor,
  StorageInterface,
  StorageSpecifications,
} from '../../index';
import { outcomeOf } from '../outcome-of';

// A drive of a form factor and an interface, of which the Build holds
// `quantity`.
function drive(
  id: string,
  formFactor: StorageFormFactor | undefined,
  iface: StorageInterface | undefined,
  quantity = 1,
): PartAndQuantity<StorageSpecifications> {
  return { id, quantity, specifications: { form_factor: formFactor, interface: iface } };
}

function nvmeDrive(id: string, quantity = 1): PartAndQuantity<StorageSpecifications> {
  return drive(id, 'M.2-2280', 'M.2 PCIe 4.0 x4', quantity);
}

function m2SataDrive(id: string, quantity = 1): PartAndQuantity<StorageSpecifications> {
  return drive(id, 'M.2-2280', 'M.2 SATA', quantity);
}

// A motherboard with an M.2 slot of each key, a slot with no key where the
// key is missing.
function boardWithSlots(
  keys: readonly (M2SlotKey | undefined)[] | undefined,
): Build['motherboard'] {
  return {
    id: 'the-board',
    specifications: {
      m2_slots: keys?.map((key) => ({
        size: '2242/2260/2280',
        key,
        interface: 'PCIe 4.0 x4',
      })),
    },
  };
}

describe("rule 14: the M.2 drives and the motherboard's M.2 slots", () => {
  it('passes fewer M.2 drives than the motherboard has M.2 slots', () => {
    const build: Build = {
      motherboard: boardWithSlots(['M', 'M']),
      storage: [nvmeDrive('the-drive')],
    };

    expect(outcomeOf(14, build)).toEqual({
      rule: 14,
      outcome: 'passes',
      parts: ['the-board', 'the-drive'],
    });
  });

  it('finds a Problem in more M.2 drives than the motherboard has M.2 slots', () => {
    const build: Build = {
      motherboard: boardWithSlots(['M']),
      storage: [nvmeDrive('a-drive'), nvmeDrive('another-drive')],
    };

    expect(outcomeOf(14, build)).toEqual({
      rule: 14,
      outcome: 'problem',
      parts: ['the-board', 'a-drive', 'another-drive'],
    });
  });

  it('passes two of one drive in two slots', () => {
    const build: Build = {
      motherboard: boardWithSlots(['M', 'M']),
      storage: [nvmeDrive('two-drives', 2)],
    };

    expect(outcomeOf(14, build)).toEqual({
      rule: 14,
      outcome: 'passes',
      parts: ['the-board', 'two-drives'],
    });
  });

  it('finds a Problem in one drive more than two slots, counting two of one drive as two', () => {
    const build: Build = {
      motherboard: boardWithSlots(['M', 'M']),
      storage: [nvmeDrive('two-drives', 2), nvmeDrive('one-more-drive')],
    };

    expect(outcomeOf(14, build)).toEqual({
      rule: 14,
      outcome: 'problem',
      parts: ['the-board', 'two-drives', 'one-more-drive'],
    });
  });

  it.each<[StorageFormFactor, StorageInterface]>([
    ['2.5"', 'SATA 6.0 Gb/s'],
    ['3.5"', 'SATA 6.0 Gb/s'],
    ['mSATA', 'mSATA'],
    ['PCIe', 'M.2 PCIe 4.0 x4'],
  ])(
    'does not count a drive whose form factor is %s, with an interface of %s',
    (formFactor, iface) => {
      const build: Build = {
        motherboard: boardWithSlots(['M']),
        storage: [nvmeDrive('an-m2-drive'), drive('the-other-drive', formFactor, iface)],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'passes',
        parts: ['the-board', 'an-m2-drive', 'the-other-drive'],
      });
    },
  );

  describe("by the slot's key", () => {
    it.each<[string, M2SlotKey, PartAndQuantity<StorageSpecifications>]>([
      ['an NVMe drive', 'M', nvmeDrive('the-drive')],
      ['an M.2 SATA drive', 'M', m2SataDrive('the-drive')],
      ['an M.2 SATA drive', 'B', m2SataDrive('the-drive')],
    ])('passes %s in a slot keyed %s', (_what, key, theDrive) => {
      const build: Build = { motherboard: boardWithSlots([key]), storage: [theDrive] };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'passes',
        parts: ['the-board', 'the-drive'],
      });
    });

    it.each<[string, M2SlotKey, PartAndQuantity<StorageSpecifications>]>([
      ['an NVMe drive', 'B', nvmeDrive('the-drive')],
      ['an NVMe drive', 'E', nvmeDrive('the-drive')],
      ['an M.2 SATA drive', 'E', m2SataDrive('the-drive')],
    ])('finds a Problem in %s in a slot keyed %s', (_what, key, theDrive) => {
      const build: Build = { motherboard: boardWithSlots([key]), storage: [theDrive] };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'problem',
        parts: ['the-board', 'the-drive'],
      });
    });

    it('passes an NVMe drive and an M.2 SATA drive in a slot keyed M and one keyed B', () => {
      const build: Build = {
        motherboard: boardWithSlots(['M', 'B']),
        storage: [nvmeDrive('an-nvme-drive'), m2SataDrive('an-m2-sata-drive')],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'passes',
        parts: ['the-board', 'an-nvme-drive', 'an-m2-sata-drive'],
      });
    });

    it('finds a Problem in more NVMe drives than slots keyed M, naming only those drives', () => {
      const build: Build = {
        motherboard: boardWithSlots(['M', 'B', 'B']),
        storage: [
          nvmeDrive('an-nvme-drive'),
          m2SataDrive('an-m2-sata-drive'),
          nvmeDrive('another-nvme-drive'),
        ],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'problem',
        parts: ['the-board', 'an-nvme-drive', 'another-nvme-drive'],
      });
    });

    it('finds a Problem in more M.2 drives than slots keyed M or B, naming every M.2 drive', () => {
      const build: Build = {
        motherboard: boardWithSlots(['M', 'B', 'E']),
        storage: [nvmeDrive('an-nvme-drive'), m2SataDrive('two-m2-sata-drives', 2)],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'problem',
        parts: ['the-board', 'an-nvme-drive', 'two-m2-sata-drives'],
      });
    });
  });

  describe('a motherboard whose list of M.2 slots is empty, which has none', () => {
    it('finds a Problem in an M.2 drive', () => {
      const build: Build = {
        motherboard: boardWithSlots([]),
        storage: [nvmeDrive('the-drive')],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'problem',
        parts: ['the-board', 'the-drive'],
      });
    });

    it('passes a drive of another form factor', () => {
      const build: Build = {
        motherboard: boardWithSlots([]),
        storage: [drive('the-drive', '2.5"', 'SATA 6.0 Gb/s')],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'passes',
        parts: ['the-board', 'the-drive'],
      });
    });
  });

  it("is unchecked when the motherboard's M.2 slots are missing", () => {
    const build: Build = {
      motherboard: boardWithSlots(undefined),
      storage: [nvmeDrive('the-drive')],
    };

    expect(outcomeOf(14, build)).toEqual({
      rule: 14,
      outcome: 'unchecked',
      missing: [{ part: 'the-board', path: 'm2_slots' }],
    });
  });

  describe('unchecked only when it matters', () => {
    it('is unchecked when the drives could need a slot with no key, naming its key', () => {
      const build: Build = {
        motherboard: boardWithSlots(['M', undefined]),
        storage: [nvmeDrive('two-drives', 2)],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'unchecked',
        missing: [{ part: 'the-board', path: 'm2_slots.1.key' }],
      });
    });

    it('passes the drives the slots with a key take, whatever a slot with no key', () => {
      const build: Build = {
        motherboard: boardWithSlots(['M', undefined]),
        storage: [nvmeDrive('the-drive')],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'passes',
        parts: ['the-board', 'the-drive'],
      });
    });

    it('finds a Problem in more M.2 drives than there are slots, whatever their keys', () => {
      const build: Build = {
        motherboard: boardWithSlots([undefined]),
        storage: [nvmeDrive('two-drives', 2)],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'problem',
        parts: ['the-board', 'two-drives'],
      });
    });

    it('is unchecked when a slot keyed B could take an M.2 drive whose interface is missing', () => {
      const build: Build = {
        motherboard: boardWithSlots(['B']),
        storage: [drive('a-drive-of-no-interface', 'M.2-2280', undefined)],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'unchecked',
        missing: [{ part: 'a-drive-of-no-interface', path: 'interface' }],
      });
    });

    it('is unchecked when a drive whose form factor is missing could tip the count', () => {
      const build: Build = {
        motherboard: boardWithSlots(['M']),
        storage: [
          nvmeDrive('an-nvme-drive'),
          drive('a-drive-of-no-form-factor', undefined, 'SATA 6.0 Gb/s'),
        ],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'unchecked',
        missing: [{ part: 'a-drive-of-no-form-factor', path: 'form_factor' }],
      });
    });

    it('judges a drive whose form factor is missing when it could not tip the count', () => {
      const build: Build = {
        motherboard: boardWithSlots(['M', 'M']),
        storage: [
          nvmeDrive('an-nvme-drive'),
          drive('a-drive-of-no-form-factor', undefined, 'SATA 6.0 Gb/s'),
        ],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'passes',
        parts: ['the-board', 'an-nvme-drive', 'a-drive-of-no-form-factor'],
      });
    });

    it('passes an M.2 drive whose interface is missing in a slot keyed M', () => {
      const build: Build = {
        motherboard: boardWithSlots(['M']),
        storage: [drive('a-drive-of-no-interface', 'M.2-2280', undefined)],
      };

      expect(outcomeOf(14, build)).toEqual({
        rule: 14,
        outcome: 'passes',
        parts: ['the-board', 'a-drive-of-no-interface'],
      });
    });
  });
});
