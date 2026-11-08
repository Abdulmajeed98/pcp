import type { Build, StorageFormFactor, StorageInterface } from '../../index';
import { drive } from '../made-up-parts';
import { outcomeOf } from '../outcome-of';

function psuWithConnectors(sata: number | undefined): Build['psu'] {
  return { id: 'the-psu', specifications: { connectors: { sata } } };
}

describe("rule 16: the SATA drives and the PSU's SATA power connectors", () => {
  it('passes fewer SATA drives than the PSU has SATA power connectors', () => {
    const build: Build = {
      storage: [drive('the-drive', '2.5"', 'SATA 6.0 Gb/s')],
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
      storage: [
        drive('an-ssd', '2.5"', 'SATA 6.0 Gb/s'),
        drive('a-hard-drive', '3.5"', 'SATA 3.0 Gb/s'),
      ],
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
      storage: [drive('two-ssds', '2.5"', 'SATA 6.0 Gb/s', 2)],
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
        drive('two-ssds', '2.5"', 'SATA 6.0 Gb/s', 2),
        drive('one-more-drive', '3.5"', 'SATA 3.0 Gb/s'),
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
      storage: [drive('the-drive', '2.5"', 'SATA 6.0 Gb/s')],
      psu: psuWithConnectors(0),
    };

    expect(outcomeOf(16, build)).toEqual({
      rule: 16,
      outcome: 'problem',
      parts: ['the-drive', 'the-psu'],
    });
  });

  it.each<[StorageInterface, StorageFormFactor]>([
    ['M.2 SATA', 'M.2-2280'],
    ['M.2 PCIe 4.0 x4', 'M.2-2280'],
    ['mSATA', 'mSATA'],
  ])('needs no SATA power for a drive whose interface is %s', (iface, formFactor) => {
    const build: Build = {
      storage: [
        drive('a-sata-drive', '2.5"', 'SATA 6.0 Gb/s'),
        drive('the-other-drive', formFactor, iface),
      ],
      psu: psuWithConnectors(1),
    };

    expect(outcomeOf(16, build)).toEqual({
      rule: 16,
      outcome: 'passes',
      parts: ['a-sata-drive', 'the-other-drive', 'the-psu'],
    });
  });

  // The owner's decision of 8 November 2026: an M.2 drive whose interface is
  // SATA is an M.2 SATA drive, which its slot powers.
  it.each<[StorageInterface]>([['SATA 1.5 Gb/s'], ['SATA 3.0 Gb/s'], ['SATA 6.0 Gb/s']])(
    'needs no SATA power for an M.2 drive whose interface is %s, an M.2 SATA drive',
    (iface) => {
      const build: Build = {
        storage: [
          drive('a-sata-drive', '2.5"', 'SATA 6.0 Gb/s'),
          drive('an-m2-sata-drive', 'M.2-2280', iface),
        ],
        psu: psuWithConnectors(1),
      };

      expect(outcomeOf(16, build)).toEqual({
        rule: 16,
        outcome: 'passes',
        parts: ['a-sata-drive', 'an-m2-sata-drive', 'the-psu'],
      });
    },
  );

  it("is unchecked when the PSU's SATA power connectors are missing", () => {
    const build: Build = {
      storage: [drive('the-drive', '2.5"', 'SATA 6.0 Gb/s')],
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
        storage: [drive('an-nvme-drive', 'M.2-2280', 'M.2 PCIe 4.0 x4')],
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
          drive('a-sata-drive', '2.5"', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-interface', '2.5"', undefined),
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
          drive('a-sata-drive', '2.5"', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-interface', '2.5"', undefined),
        ],
        psu: psuWithConnectors(2),
      };

      expect(outcomeOf(16, build)).toEqual({
        rule: 16,
        outcome: 'passes',
        parts: ['a-sata-drive', 'a-drive-of-no-interface', 'the-psu'],
      });
    });

    it('is unchecked when a drive of a SATA interface whose form factor is missing could tip the count, since it may be an M.2 SATA drive', () => {
      const build: Build = {
        storage: [
          drive('a-sata-drive', '2.5"', 'SATA 6.0 Gb/s'),
          drive('a-drive-of-no-form-factor', undefined, 'SATA 6.0 Gb/s'),
        ],
        psu: psuWithConnectors(1),
      };

      expect(outcomeOf(16, build)).toEqual({
        rule: 16,
        outcome: 'unchecked',
        missing: [{ part: 'a-drive-of-no-form-factor', path: 'form_factor' }],
      });
    });
  });
});
