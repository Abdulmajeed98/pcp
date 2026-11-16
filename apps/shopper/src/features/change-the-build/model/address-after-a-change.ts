import type { Language } from '@pcp/i18n';

import {
  buildAddress,
  type Category,
  identifierIn,
  isCategory,
  isKitOrDrive,
  type Refusal,
} from '@/entities/build';
import { nameInTheAddress } from '@/entities/category';

// The address each form that changes the Build is answered with, 303, as the
// switches' forms are: the Build page, in the form's language, at the place
// of the Category it changed (`at`), so that a phone lands on the line rather
// than at the top of a long page (DESIGN.md's Back to the Build after a
// pick); from its top after emptying. A change past the limits is not
// applied, and the address says why (`refused`), so that the page says it,
// with script and without.
export function addressAfterAChange(
  language: Language,
  { at, refused }: { at?: Category; refused?: Refusal },
): string {
  const query =
    refused === undefined
      ? ''
      : `?${new URLSearchParams({
          refused: refused.reason,
          category: refused.category,
          ...('part' in refused ? { part: refused.part } : {}),
        }).toString()}`;
  return `${buildAddress(language)}${query}${at === undefined ? '' : `#${nameInTheAddress(at)}`}`;
}

// Why a change was refused, as the Build page reads it from its address, or
// nothing. What it does not know, as in an address changed by hand, says
// nothing.
export function refusalIn(query: {
  get(name: string): string | null;
}): Refusal | undefined {
  const category = query.get('category') ?? '';
  if (!isCategory(category) || !isKitOrDrive(category)) return undefined;

  const reason = query.get('refused');
  if (reason === 'mostKitsOrDrives') return { reason, category };
  if (reason !== 'mostOfOne' && reason !== 'notAQuantity') return undefined;
  const part = identifierIn(query.get('part') ?? '');
  return part === undefined ? undefined : { reason, category, part };
}
