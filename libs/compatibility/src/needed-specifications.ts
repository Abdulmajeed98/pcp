import type { Category } from './build';
import { rules } from './rules/rules';

// A Category's needed specifications, by their paths: the ones the
// Compatibility Rules read in it, as each rule states, in the order the rules
// first read them. A rule that reads a list of rows, such as a motherboard's
// PCIe slots, names the list.
export function neededSpecificationsOf(category: Category): readonly string[] {
  return [...new Set(rules.flatMap((rule) => rule.involves[category] ?? []))];
}
