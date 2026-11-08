import type { StorageFormFactor } from '../fixed-sets';
import { type Amount, together } from './amounts';
import { drivesWhose } from './drives';
import { and, exceeds, not, or, problemWhen } from './findings';
import { rule } from './statement';

// Rule 15: the Build has more 3.5-inch or 2.5-inch drives than the case has
// bays. A 2.5-inch drive takes a free 3.5-inch bay when no 2.5-inch bay is
// left, so it is a Compatibility Problem when the 3.5-inch drives outnumber
// the 3.5-inch bays, or the drives of both sizes the bays of both. A case
// that gives no internal bay at all is a Compatibility Warning for a 2.5-inch
// drive, since test benches and small cases mount one where OpenDB counts no
// bay, and a Problem for a 3.5-inch one (the owner's decision of 15 October
// 2026).
export const rule15 = rule({
  number: 15,
  involves: { storage: ['form_factor'], case: ['internal_3_5_bays', 'internal_2_5_bays'] },
  judge: ({ storage, case: pcCase }) => {
    // The drives of the sizes. A drive whose form factor is missing may be of
    // them or not.
    const drivesOf = (sizes: readonly StorageFormFactor[]): Amount =>
      drivesWhose(storage, 'form_factor', (formFactor) => sizes.includes(formFactor));
    const bays35 = pcCase.read('internal_3_5_bays');
    const bays = together(bays35, pcCase.read('internal_2_5_bays'));
    const someBay = exceeds(bays, 0);
    return problemWhen(
      or(
        exceeds(drivesOf(['3.5"']), bays35),
        and(someBay, exceeds(drivesOf(['3.5"', '2.5"']), bays)),
      ),
      { warningWhen: and(not(someBay), exceeds(drivesOf(['2.5"']), 0)) },
    );
  },
});
