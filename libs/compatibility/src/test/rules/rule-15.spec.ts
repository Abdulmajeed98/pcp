import type {
  Build,
  PartAndQuantity,
  StorageFormFactor,
  StorageInterface,
  StorageSpecifications,
} from '../../index';
import { outcomeOf } from '../outcome-of';

// A drive of a form factor, of which the Build holds `quantity`.
function drive(
  id: string,
  formFactor: StorageFormFactor | undefined,
  quantity = 1,
  iface: StorageInterface = 'SATA 6.0 Gb/s',
): PartAndQuantity<StorageSpecifications> {
  return { id, quantity, specifications: { form_factor: formFactor, interface: iface } };
}

function caseWithBays(
  bays35: number | undefined,
  bays25: number | undefined,
): Build['case'] {
  return {
    id: 'the-case',
    specifications: { internal_3_5_bays: bays35, internal_2_5_bays: bays25 },
  };
}

describe("rule 15: the 3.5-inch and 2.5-inch drives and the case's bays", () => {
  it('passes fewer drives than the case has bays of their size', () => {
    const build: Build = {
      storage: [drive('a-hard-drive', '3.5"'), drive('an-ssd', '2.5"')],
      case: caseWithBays(2, 2),
    };

    expect(outcomeOf(15, build)).toEqual({
      rule: 15,
      outcome: 'passes',
      parts: ['a-hard-drive', 'an-ssd', 'the-case'],
    });
  });

  it('finds a Problem in more 3.5-inch drives than 3.5-inch bays, which no 2.5-inch bay takes', () => {
    const build: Build = {
      storage: [drive('a-hard-drive', '3.5"'), drive('another-hard-drive', '3.5"')],
      case: caseWithBays(1, 4),
    };

    expect(outcomeOf(15, build)).toEqual({
      rule: 15,
      outcome: 'problem',
      parts: ['a-hard-drive', 'another-hard-drive', 'the-case'],
    });
  });

  it('finds a Problem in a 2.5-inch drive when every bay is taken', () => {
    const build: Build = {
      storage: [drive('a-hard-drive', '3.5"'), drive('an-ssd', '2.5"')],
      case: caseWithBays(1, 0),
    };

    expect(outcomeOf(15, build)).toEqual({
      rule: 15,
      outcome: 'problem',
      parts: ['a-hard-drive', 'an-ssd', 'the-case'],
    });
  });

  it('passes a 2.5-inch drive in a free 3.5-inch bay when no 2.5-inch bay is left', () => {
    const build: Build = {
      storage: [drive('a-hard-drive', '3.5"'), drive('an-ssd', '2.5"')],
      case: caseWithBays(2, 0),
    };

    expect(outcomeOf(15, build)).toEqual({
      rule: 15,
      outcome: 'passes',
      parts: ['a-hard-drive', 'an-ssd', 'the-case'],
    });
  });

  describe('a case that gives no internal bay at all', () => {
    it('finds a Warning in a 2.5-inch drive, which such a case may mount where no bay is counted', () => {
      const build: Build = {
        storage: [drive('an-ssd', '2.5"'), drive('an-nvme-drive', 'M.2-2280')],
        case: caseWithBays(0, 0),
      };

      expect(outcomeOf(15, build)).toEqual({
        rule: 15,
        outcome: 'warning',
        parts: ['an-ssd', 'the-case'],
      });
    });

    it('finds a Problem in a 3.5-inch drive, naming it and not a 2.5-inch drive beside it', () => {
      const build: Build = {
        storage: [drive('an-ssd', '2.5"'), drive('a-hard-drive', '3.5"')],
        case: caseWithBays(0, 0),
      };

      expect(outcomeOf(15, build)).toEqual({
        rule: 15,
        outcome: 'problem',
        parts: ['a-hard-drive', 'the-case'],
      });
    });

    it('passes a drive that needs no bay', () => {
      const build: Build = {
        storage: [drive('an-nvme-drive', 'M.2-2280')],
        case: caseWithBays(0, 0),
      };

      expect(outcomeOf(15, build)).toEqual({
        rule: 15,
        outcome: 'passes',
        parts: ['an-nvme-drive', 'the-case'],
      });
    });
  });

  it('passes as many drives as the bays, counting two of one drive as two', () => {
    const build: Build = {
      storage: [drive('two-ssds', '2.5"', 2), drive('a-hard-drive', '3.5"')],
      case: caseWithBays(1, 2),
    };

    expect(outcomeOf(15, build)).toEqual({
      rule: 15,
      outcome: 'passes',
      parts: ['two-ssds', 'a-hard-drive', 'the-case'],
    });
  });

  it('finds a Problem in one drive more than the bays, naming every drive in a bay', () => {
    const build: Build = {
      storage: [
        drive('two-ssds', '2.5"', 2),
        drive('a-hard-drive', '3.5"'),
        drive('one-more-ssd', '2.5"'),
        drive('an-nvme-drive', 'M.2-2280'),
      ],
      case: caseWithBays(1, 2),
    };

    expect(outcomeOf(15, build)).toEqual({
      rule: 15,
      outcome: 'problem',
      parts: ['two-ssds', 'a-hard-drive', 'one-more-ssd', 'the-case'],
    });
  });

  it('reads a drive by its form factor, whatever its interface', () => {
    const build: Build = {
      storage: [
        drive('a-sas-drive', '3.5"', 1, 'SAS 12.0 Gb/s'),
        drive('a-pata-drive', '3.5"', 1, 'PATA 100'),
      ],
      case: caseWithBays(1, 2),
    };

    expect(outcomeOf(15, build)).toEqual({
      rule: 15,
      outcome: 'problem',
      parts: ['a-sas-drive', 'a-pata-drive', 'the-case'],
    });
  });

  it.each<[StorageFormFactor]>([['M.2-2280'], ['mSATA'], ['PCIe']])(
    'needs no bay for a drive whose form factor is %s',
    (formFactor) => {
      const build: Build = {
        storage: [drive('a-hard-drive', '3.5"'), drive('the-other-drive', formFactor)],
        case: caseWithBays(1, 0),
      };

      expect(outcomeOf(15, build)).toEqual({
        rule: 15,
        outcome: 'passes',
        parts: ['a-hard-drive', 'the-other-drive', 'the-case'],
      });
    },
  );

  it("is unchecked when the case's 3.5-inch bays are missing", () => {
    const build: Build = {
      storage: [drive('a-hard-drive', '3.5"')],
      case: caseWithBays(undefined, 2),
    };

    expect(outcomeOf(15, build)).toEqual({
      rule: 15,
      outcome: 'unchecked',
      missing: [{ part: 'the-case', path: 'internal_3_5_bays' }],
    });
  });

  describe('unchecked only when it matters', () => {
    it("is unchecked when the case's 2.5-inch bays are missing and the 3.5-inch bays left are too few", () => {
      const build: Build = {
        storage: [drive('a-hard-drive', '3.5"'), drive('an-ssd', '2.5"')],
        case: caseWithBays(1, undefined),
      };

      expect(outcomeOf(15, build)).toEqual({
        rule: 15,
        outcome: 'unchecked',
        missing: [{ part: 'the-case', path: 'internal_2_5_bays' }],
      });
    });

    it("passes a 2.5-inch drive that a free 3.5-inch bay takes, whatever the case's 2.5-inch bays", () => {
      const build: Build = {
        storage: [drive('an-ssd', '2.5"')],
        case: caseWithBays(2, undefined),
      };

      expect(outcomeOf(15, build)).toEqual({
        rule: 15,
        outcome: 'passes',
        parts: ['an-ssd', 'the-case'],
      });
    });

    it('is unchecked when a drive whose form factor is missing could tip the count', () => {
      const build: Build = {
        storage: [
          drive('a-hard-drive', '3.5"'),
          drive('a-drive-of-no-form-factor', undefined),
        ],
        case: caseWithBays(1, 0),
      };

      expect(outcomeOf(15, build)).toEqual({
        rule: 15,
        outcome: 'unchecked',
        missing: [{ part: 'a-drive-of-no-form-factor', path: 'form_factor' }],
      });
    });

    it('judges a drive whose form factor is missing when it could not tip the count', () => {
      const build: Build = {
        storage: [
          drive('a-hard-drive', '3.5"'),
          drive('a-drive-of-no-form-factor', undefined),
        ],
        case: caseWithBays(2, 1),
      };

      expect(outcomeOf(15, build)).toEqual({
        rule: 15,
        outcome: 'passes',
        parts: ['a-hard-drive', 'a-drive-of-no-form-factor', 'the-case'],
      });
    });

    it('is unchecked when a case with no bay at all holds a drive whose form factor is missing, which could make a Problem or a Warning', () => {
      const build: Build = {
        storage: [drive('a-drive-of-no-form-factor', undefined)],
        case: caseWithBays(0, 0),
      };

      expect(outcomeOf(15, build)).toEqual({
        rule: 15,
        outcome: 'unchecked',
        missing: [{ part: 'a-drive-of-no-form-factor', path: 'form_factor' }],
      });
    });

    it('is unchecked when a case with no 3.5-inch bay does not say its 2.5-inch bays, which could make a Warning', () => {
      const build: Build = {
        storage: [drive('an-ssd', '2.5"')],
        case: caseWithBays(0, undefined),
      };

      expect(outcomeOf(15, build)).toEqual({
        rule: 15,
        outcome: 'unchecked',
        missing: [{ part: 'the-case', path: 'internal_2_5_bays' }],
      });
    });
  });
});
