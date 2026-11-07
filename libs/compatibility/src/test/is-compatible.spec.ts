import {
  type Build,
  type Category,
  isCompatible,
  judgeBuild,
  type MotherboardSpecifications,
  type Part,
  type PartOf,
  type RamSpecifications,
  type RuleOutcome,
  type Socket,
  type StorageSpecifications,
} from '../index';

function boardOf(id: string, socket: Socket): Part<MotherboardSpecifications> {
  return { id, specifications: { socket } };
}

// A kit of two DDR5 modules of 16 GB.
function kitOfTwo(id: string): Part<RamSpecifications> {
  return {
    id,
    specifications: { ram_type: 'DDR5', modules: { quantity: 2, capacity_gb: 16 } },
  };
}

function boardWithSlots(slots: number): Part<MotherboardSpecifications> {
  return {
    id: 'the-board',
    specifications: { memory: { ram_type: 'DDR5', slots, max: 1024 } },
  };
}

// A 2.5-inch SATA drive.
function sataDrive(id: string): Part<StorageSpecifications> {
  return { id, specifications: { interface: 'SATA 6.0 Gb/s', form_factor: '2.5"' } };
}

function boardWithSataPorts(ports: number): Part<MotherboardSpecifications> {
  return {
    id: 'the-board',
    specifications: { storage_devices: { sata_6_gb_s: ports, sata_3_gb_s: 0 } },
  };
}

describe('whether a Part is compatible with a Build', () => {
  describe("a motherboard, in place of the Build's", () => {
    // The Build's own motherboard makes a Problem with its CPU.
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: { socket: 'AM5' } },
      motherboard: boardOf('the-builds-board', 'AM4'),
    };

    it("is not compatible when its socket differs from the CPU's", () => {
      const board = boardOf('an-am4-board', 'AM4');

      expect(isCompatible('motherboard', board, build)).toBe(false);
    });

    it("is compatible when its socket matches the CPU's, though the Build's own motherboard makes a Problem with it", () => {
      const board = boardOf('an-am5-board', 'AM5');

      expect(isCompatible('motherboard', board, build)).toBe(true);
    });
  });

  describe("a RAM kit, beside the Build's others with a quantity of one", () => {
    it("is not compatible when a kit of two modules joins a kit of two on a motherboard's two slots", () => {
      const build: Build = {
        motherboard: boardWithSlots(2),
        ram: [{ ...kitOfTwo('the-builds-kit'), quantity: 1 }],
      };

      expect(isCompatible('ram', kitOfTwo('another-kit'), build)).toBe(false);
    });

    it("is compatible when a kit of two modules joins a kit of two on a motherboard's four slots", () => {
      const build: Build = {
        motherboard: boardWithSlots(4),
        ram: [{ ...kitOfTwo('the-builds-kit'), quantity: 1 }],
      };

      expect(isCompatible('ram', kitOfTwo('another-kit'), build)).toBe(true);
    });

    it('counts a kit the Build already holds once more', () => {
      const build: Build = {
        motherboard: boardWithSlots(2),
        ram: [{ ...kitOfTwo('the-kit'), quantity: 1 }],
      };

      expect(isCompatible('ram', kitOfTwo('the-kit'), build)).toBe(false);
    });
  });

  describe("a drive, beside the Build's others with a quantity of one", () => {
    it("is not compatible when a SATA drive joins a SATA drive on a motherboard's one SATA port", () => {
      const build: Build = {
        motherboard: boardWithSataPorts(1),
        storage: [{ ...sataDrive('the-builds-drive'), quantity: 1 }],
      };

      expect(isCompatible('storage', sataDrive('another-drive'), build)).toBe(false);
    });

    it("is compatible when a SATA drive joins a SATA drive on a motherboard's two SATA ports", () => {
      const build: Build = {
        motherboard: boardWithSataPorts(2),
        storage: [{ ...sataDrive('the-builds-drive'), quantity: 1 }],
      };

      expect(isCompatible('storage', sataDrive('another-drive'), build)).toBe(true);
    });
  });

  describe('a Compatibility Problem the Build already had', () => {
    it("leaves compatible a RAM kit of the motherboard's type, though the CPU and the motherboard differ in socket", () => {
      const build: Build = {
        cpu: {
          id: 'the-cpu',
          specifications: {
            socket: 'AM4',
            specifications: { memory: { types: ['DDR5'] } },
          },
        },
        motherboard: {
          id: 'the-board',
          specifications: {
            socket: 'AM5',
            memory: { ram_type: 'DDR5', slots: 4, max: 192 },
          },
        },
      };

      expect(isCompatible('ram', kitOfTwo('the-kit'), build)).toBe(true);
    });
  });

  describe('a Compatibility Warning or an unchecked rule', () => {
    it("leaves compatible a PSU that brings only rule 11's Warning, for the adapter", () => {
      // A GPU with a 12VHPWR socket, and a PSU without that cable but with
      // 6+2-pin connectors: the Build works with the GPU's adapter.
      const build: Build = {
        gpu: {
          id: 'the-gpu',
          specifications: {
            power_connectors: {
              pcie_6_pin: 0,
              pcie_8_pin: 0,
              pcie_12VHPWR: 1,
              pcie_12V_2x6: 0,
            },
          },
        },
      };
      const psu = {
        id: 'the-psu',
        specifications: { connectors: { pcie_6_plus_2_pin: 3, pcie_12vhpwr: 0 } },
      };

      expect(isCompatible('psu', psu, build)).toBe(true);
    });

    it('leaves compatible a GPU whose length is missing, which leaves rule 9 unchecked', () => {
      const build: Build = {
        case: {
          id: 'the-case',
          specifications: { max_video_card_length: 400, expansion_slots: 7 },
        },
      };

      const gpu = { id: 'the-gpu', specifications: { total_slot_width: 2 } };

      expect(isCompatible('gpu', gpu, build)).toBe(true);
    });
  });

  // The picker and the Build page give one answer: a Part the picker hides is
  // one that judging the Build with it finds in a Compatibility Problem.
  describe('a Part that makes a Compatibility Problem', () => {
    it.each<[string, Category, PartOf<Category>, Build, RuleOutcome]>([
      [
        "a CPU that does not support the RAM's type",
        'cpu',
        {
          id: 'the-cpu',
          specifications: { specifications: { memory: { types: ['DDR4'] } } },
        },
        { ram: [{ id: 'the-kit', quantity: 1, specifications: { ram_type: 'DDR5' } }] },
        { rule: 3, outcome: 'problem', parts: ['the-cpu', 'the-kit'] },
      ],
      [
        "a CPU cooler that does not list the CPU's socket",
        'cpuCooler',
        { id: 'the-cooler', specifications: { cpu_sockets: ['AM4', 'LGA 1700'] } },
        { cpu: { id: 'the-cpu', specifications: { socket: 'AM5' } } },
        { rule: 2, outcome: 'problem', parts: ['the-cpu', 'the-cooler'] },
      ],
      [
        'a motherboard with no 16-lane PCIe slot for the GPU',
        'motherboard',
        { id: 'the-board', specifications: { pcie_slots: [{ quantity: 2, lanes: 4 }] } },
        { gpu: { id: 'the-gpu', specifications: {} } },
        { rule: 8, outcome: 'problem', parts: ['the-board', 'the-gpu'] },
      ],
      [
        'a GPU that occupies more slots than the case has',
        'gpu',
        { id: 'the-gpu', specifications: { length: 300, total_slot_width: 2.5 } },
        {
          case: {
            id: 'the-case',
            specifications: { max_video_card_length: 400, expansion_slots: 2 },
          },
        },
        { rule: 10, outcome: 'problem', parts: ['the-gpu', 'the-case'] },
      ],
      [
        "a case that does not take the motherboard's form factor",
        'case',
        {
          id: 'the-case',
          specifications: { supported_motherboard_form_factors: ['Mini-ITX', 'Micro ATX'] },
        },
        { motherboard: { id: 'the-board', specifications: { form_factor: 'ATX' } } },
        { rule: 7, outcome: 'problem', parts: ['the-board', 'the-case'] },
      ],
      [
        'a PSU below 1.3 times the estimated power draw',
        'psu',
        { id: 'the-psu', specifications: { wattage: 550 } },
        {
          cpu: { id: 'the-cpu', specifications: { specifications: { tdp: 125 } } },
          gpu: { id: 'the-gpu', specifications: { tdp: 300 } },
        },
        { rule: 12, outcome: 'problem', parts: ['the-cpu', 'the-gpu', 'the-psu'] },
      ],
    ])(
      'is not compatible, as judging the Build with it finds: %s',
      (_what, category, part, build, problem) => {
        expect(isCompatible(category, part, build)).toBe(false);
        expect(judgeBuild({ ...build, [category]: part })).toContainEqual(problem);
      },
    );
  });
});
