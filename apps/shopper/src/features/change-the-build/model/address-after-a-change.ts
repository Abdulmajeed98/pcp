import type { Language } from '@pcp/i18n';

import { type Category, identifierIn, type Refusal } from '@/entities/build';
import { nameInTheAddress } from '@/entities/category';

// The Build page's address, in a language: `/<language>/build`.
export function buildAddress(language: Language): string {
  return `/${language}${buildPath}`;
}

// The part of the Build page's address after its language.
export const buildPath = '/build';

// A Category's picker's address, in a language, its Category written as on
// a Category page: `/<language>/build/cpu-cooler`. Ticket 09 of the builder
// module builds the page.
export function pickerAddress(language: Language, category: Category): string {
  return `${buildAddress(language)}/${nameInTheAddress(category)}`;
}

// The name of a Category's place on the Build page, which an address leads
// to after a change: `#ram`, `#cpu-cooler`.
export function placeOf(category: Category): string {
  return nameInTheAddress(category);
}

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
  return `${buildAddress(language)}${query}${at === undefined ? '' : `#${placeOf(at)}`}`;
}

// Why a change was refused, as the Build page reads it from its address, or
// nothing. What it does not know, as in an address changed by hand, says
// nothing.
export function refusalIn(query: {
  get(name: string): string | null;
}): Refusal | undefined {
  const category = query.get('category');
  if (category !== 'ram' && category !== 'storage') return undefined;

  const reason = query.get('refused');
  if (reason === 'mostKitsOrDrives') return { reason, category };
  if (reason !== 'mostOfOne' && reason !== 'notAQuantity') return undefined;
  const part = identifierIn(query.get('part') ?? '');
  return part === undefined ? undefined : { reason, category, part };
}
