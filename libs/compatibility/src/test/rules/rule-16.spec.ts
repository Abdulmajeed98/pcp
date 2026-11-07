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

function psuWithConnectors(sata: number | undefined): Build['psu'] {
  return { id: 'the-psu', specifications: { connectors: { sata } } };
}

describe("rule 16: the SATA drives and the PSU's SATA power connectors", () => {
  it('passes fewer SATA drives than the PSU has SATA power connectors', () => {
    const build: Build = {
      storage: [drive('the-drive', 'SATA 6.0 Gb/s')],
      psu: psuWithConnectors(4),
    };

    expect(outcomeOf(16, build)).toEqual({
      rule: 16,
      outcome: 'passes',
      parts: ['the-drive', 'the-psu'],
    });
  });

  it('finds a Problem in more SATA drives than the PSU has SATA power connectors', () => {
    const build: Build = {
      storage: [drive('an-ssd', 'SATA 6.0 Gb/s'), drive('a-hard-drive', 'SATA 3.0 Gb/s')],
      psu: psuWithConnectors(1),
    };

    expect(outcomeOf(16, build)).toEqual({
      rule: 16,
      outcome: 'problem',
      parts: ['an-ssd', 'a-hard-drive', 'the-psu'],
    });
  });

  it('passes as many SATA drives as the PSU has SATA power connectors', () => {
    const build: Build = {
      storage: [drive('two-ssds', 'SATA 6.0 Gb/s', 2)],
      psu: psuWithConnectors(2),
    };

    expect(outcomeOf(16, build)).toEqual({
      rule: 16,
      outcome: 'passes',
      parts: ['two-ssds', 'the-psu'],
    });
  });

  it('finds a Problem in one SATA drive more than the connectors, counting two of one drive as two', () => {
    const build: Build = {
      storage: [
        drive('two-ssds', 'SATA 6.0 Gb/s', 2),
        drive('one-more-drive', 'SATA 3.0 Gb/s'),
      ],
      psu: psuWithConnectors(2),
    };

    expect(outcomeOf(16, build)).toEqual({
      rule: 16,
      outcome: 'problem',
      parts: ['two-ssds', 'one-more-drive', 'the-psu'],
    });
  });

  it('finds a Problem in a SATA drive and a PSU with no SATA power connector, a 0 given to the library directly', () => {
    const build: Build = {
      storage: [drive('the-drive', 'SATA 6.0 Gb/s')],
      psu: psuWithConnectors(0),
    };

    expect(outcomeOf(16, build)).toEqual({
      rule: 16,
      outcome: 'problem',
      parts: ['the-drive', 'the-psu'],
    });
  });

  it.each<[StorageInterface]>([['M.2 SATA'], ['M.2 PCIe 4.0 x4'], ['mSATA']])(
    'needs no SATA power for a drive whose interface is %s',
    (iface) => {
      const build: Build = {
        storage: [drive('a-sata-drive', 'SATA 6.0 Gb/s'), drive('the-other-drive', iface)],
        psu: psuWithConnectors(1),
      };

      expect(outcomeOf(16, build)).toEqual({
        rule: 16,
        outcome: 'passes',
        parts: ['a-sata-drive', 'the-other-drive', 'the-psu'],
      });
    },
  );

  it("is unchecked when the PSU's SATA power connectors are missing", () => {
    const build: Build = {
      storage: [drive('the-drive', 'SATA 6.0 Gb/s')],
      psu: psuWithConnectors(undefined),
    };

    expect(outcomeOf(16, build)).toEqual({
      rule: 16,
      outcome: 'unchecked',
      missing: [{ part: 'the-psu', path: 'connectors.sata' }],
    });
  });

  describe('unchecked only when it matters', () => {
    it("passes a Build with no SATA drive whatever the PSU's connectors", () => {
      const build: Build = {
        storage: [drive('an-nvme-drive', 'M.2 PCIe 4.0 x4')],
        psu: psuWithConnectors(undefined),
      };

      expect(outcomeOf(16, build)).toEqual({
        rule: 16,
        outcome: 'passes',
        parts: ['an-nvme-drive', 'the-psu'],
      });
    });

    it('is unchecked when a drive whose interface is missing could tip the count', () => {
      const build: Build = {
        storage: [
          drive('a-sata-drive', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-interface', undefined),
        ],
        psu: psuWithConnectors(1),
      };

      expect(outcomeOf(16, build)).toEqual({
        rule: 16,
        outcome: 'unchecked',
        missing: [{ part: 'a-drive-of-no-interface', path: 'interface' }],
      });
    });

    it('judges a drive whose interface is missing when it could not tip the count', () => {
      const build: Build = {
        storage: [
          drive('a-sata-drive', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-interface', undefined),
        ],
        psu: psuWithConnectors(2),
      };

      expect(outcomeOf(16, build)).toEqual({
        rule: 16,
        outcome: 'passes',
        parts: ['a-sata-drive', 'a-drive-of-no-interface', 'the-psu'],
      });
    });
  });
});
