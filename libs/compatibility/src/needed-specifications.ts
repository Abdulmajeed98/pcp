import type { CategoryKey } from './build';
import { rules } from './rules/rules';

// A Category's needed specifications, by their paths: the ones the
// Compatibility Rules read in it, as each rule states, whether the rule
// involves the Category or reads it when the Build holds a Part of it, as
// rule 12 reads a GPU's TDP, in the order the rules first read them. A rule
// that reads a list of rows, such as a motherboard's PCIe slots, names the
// list.
export function neededSpecificationsOf(category: CategoryKey): readonly string[] {
  return [
    ...new Set(
      rules.flatMap((rule) => [
        ...(rule.involves[category] ?? []),
        ...(rule.readsWhenHeld[category] ?? []),
      ]),
    ),
  ];
}
