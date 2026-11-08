import type { CategoryKey, PartOf, Build as RulesBuild } from '@pcp/compatibility';

import { Part } from '../part/Part';
import { specificationListOf } from '../specification/specification-lists';
import { Build } from './Build';

// A stored Part as the Compatibility Rules read it: its identifier, by which
// every outcome names it, and its needed specifications, the paths the rules
// read in its Category, as its Category's list holds them. Written once, for
// every endpoint that judges a Build or a Part.
//
// The specifications are typed for the rules as the catalog checked them when
// they were kept: each value of a fixed set is one of its set.
export function partForTheRules(part: Part): PartOf<CategoryKey> {
  return {
    id: part.getId(),
    specifications: specificationListOf(part.getCategory()).neededHeldIn(
      part.getSpecifications(),
    ),
  } as PartOf<CategoryKey>;
}

// A Build as the Compatibility Rules read it: each Part under its Category's
// key, handed to them by `partForTheRules`, and each RAM kit and drive, the
// Parts a Build holds a quantity of, in a list in the Build's order, with its
// quantity.
export function buildForTheRules(build: Build): RulesBuild {
  const held: Record<string, unknown> = {};
  for (const each of build.getParts()) {
    const key = each.getPart().getCategory().getKey();
    const part = partForTheRules(each.getPart());
    const quantity = each.getQuantity();
    held[key] =
      quantity === undefined
        ? part
        : [...((held[key] as readonly unknown[] | undefined) ?? []), { ...part, quantity }];
  }
  return held as RulesBuild;
}
