import { isCompatible } from '@pcp/compatibility';

import { Part } from '../part/Part';
import { specificationListOf } from '../specification/specification-lists';
import { Build } from './Build';
import { buildForTheRules, partForTheRules } from './parts-for-the-rules';

// Whether a Part is Compatible with a Build (CMP-4), as the picker asks of
// each Part it lists: through the library's `isCompatible`, which puts a
// Part of a Category a Build holds one of in place of the Build's Part, adds
// a RAM kit or a drive beside the others, and finds the Part not Compatible
// only when that Build has a Compatibility Problem naming it. A Compatibility
// Warning or an unchecked rule leaves it Compatible. The Build and each Part
// reach the rules through `buildForTheRules` and `partForTheRules`, the
// Build once for every Part asked of it.
export function compatibleWith(build: Build): (part: Part) => boolean {
  const judged = buildForTheRules(build);
  return (part) =>
    isCompatible(
      specificationListOf(part.getCategory()).getCategoryKey(),
      partForTheRules(part),
      judged,
    );
}
