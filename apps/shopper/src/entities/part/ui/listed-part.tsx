import type { VisiblePartResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';

import { ShownPrice } from '@/shared/price';
import { Item, type NameAlone } from '@/shared/ui';

import { partAddress } from '../model/addresses';
import { PartSquare } from './part-square';

// A Part on a Category page (DESIGN.md's A Part on a Category page): an item
// of the Category's sheet, with its photo or its Category's icon in a small
// square on the start side; its name, in English in every language (LANG-3),
// as a link to its Part page; the leader; and at the end its Lowest Price,
// drawn by the one component that draws a Shown Price, or, when every Vendor
// has it out of stock, "Out of stock" in words in the price's place, never a
// colour alone. On its second line, its manufacturer in English and how many
// Vendors offer it. An in-stock Part with no Lowest Price, which only happens
// before the Admin sets the first Platform Rate, has nothing at its end.
//
// A long name keeps its words whole by taking the whole line, its leader and
// price on the line under it (`nameAlone`): on a phone past 24 characters,
// more than two lines of the 10 to 12 a phone's column beside a price holds
// at 360 pixels, and at every width past 80, the Long Name Rule's second
// band.
//
// Its end settles into the sheet's column of prices as the sheet prints
// (Motion 2), `place` being its place on the sheet.
export async function ListedPart({
  part,
  place,
}: {
  part: VisiblePartResponse;
  place: number;
}) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('Part')]);
  const nameAlone: NameAlone | undefined =
    part.name.length > 80 ? 'always' : part.name.length > 24 ? 'on-a-phone' : undefined;

  return (
    <Item
      testId="listed-part"
      data={{ 'data-part': part.id }}
      place={place}
      nameAlone={nameAlone}
      picture={<PartSquare part={part} />}
      name={
        <a href={partAddress(language, part.id)} className="hover-underline">
          <AlwaysEnglish>{part.name}</AlwaysEnglish>
        </a>
      }
      end={
        part.lowestPrice !== null ? (
          <ShownPrice price={part.lowestPrice} />
        ) : part.inStock ? undefined : (
          <span
            data-testid="out-of-stock"
            className="text-base font-normal text-muted-foreground"
          >
            {t('outOfStock')}
          </span>
        )
      }
      second={
        <>
          <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
          {' · '}
          {t('vendors', {
            count: part.vendorCount,
            countText: formatNumber(part.vendorCount),
          })}
        </>
      }
    />
  );
}
