import type { BuildPartResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { partAddress, PartSquare } from '@/entities/part';
import { vendorAddress } from '@/entities/vendor';
import { ShownPrice } from '@/shared/price';
import { Item, whereAPartsNameStands } from '@/shared/ui';

// A Part's line on a Build's sheet (DESIGN.md's A Category on the Build's
// sheet), printed as a Part on a Category page is: its photo or its
// Category's icon in the small square, its name in English as a link to its
// Part page (a Visible Part only), the leader, its price at the end, and its
// second line, its manufacturer and where its Lowest Price comes from; a long
// name keeps the Long Name Rule. The Build page sets its controls under it.
// A Shared Build's sheet has no controls, so a kit's or a drive's quantity is
// in its second line, "Quantity 2" (`quantityShown`, DESIGN.md's The Shared
// Build page).
export async function PartLine({
  part,
  place,
  quantityShown = false,
}: {
  part: BuildPartResponse;
  // The line's place on the sheet, from 0, which staggers its price as the
  // sheet prints (Motion 2).
  place: number;
  quantityShown?: boolean;
}) {
  const [language, t, shared] = await Promise.all([
    getLocale(),
    getTranslations('BuildPage'),
    getTranslations('SharedBuildPage'),
  ]);

  // A Part's price on the Build's sheet (DESIGN.md's A Part's price on the
  // Build's sheet), the first price view (BLD-7): its Lowest Price times its
  // quantity, as the API answers it, drawn by the Shown Price with its "≈",
  // so that the sheet's column adds up to the slip's total; for an Unstocked
  // Part, "No Vendor has it" in words in the price's place, never a colour
  // alone; and nothing for a Part whose price cannot be shown yet, as a
  // Category page shows none. Each price is named for the page's script,
  // which settles it again when a change in place alters it (Motion 11).
  const priceOf = () => {
    if (part.lowestPrice !== null) {
      return (
        <span data-figure={`price-${part.id}`} data-testid="part-price">
          <ShownPrice price={part.lowestPrice.timesQuantity} />
        </span>
      );
    }
    if (!part.unstocked) return undefined;
    return (
      <span
        data-testid="no-vendor-has-it"
        className="text-base font-normal text-muted-foreground"
      >
        {t('price.noVendorHasIt')}
      </span>
    );
  };

  // Its second line after its manufacturer: for a kit or a drive held more
  // than once, its Lowest Price of one, "2 × 172,000 IQD"; and "Lowest at"
  // the Vendor its Lowest Price comes from, linked to its Vendor page, its
  // name as written. An Unstocked Part says instead, in words, that no Vendor
  // has it in stock, so it is left out of every total.
  const whereItIsPriced = () => {
    if (part.unstocked) {
      return (
        <>
          {' · '}
          <span data-testid="unstocked">{t('price.unstocked')}</span>
        </>
      );
    }
    const lowest = part.lowestPrice;
    if (lowest === null) return null;
    return (
      <>
        {part.quantity !== null && part.quantity > 1 && (
          <>
            {' · '}
            <AlwaysEnglish data-testid="price-of-one">
              {formatNumber(part.quantity)} ×{' '}
              <ShownPrice price={lowest.shownPrice} className="font-normal" />
            </AlwaysEnglish>
          </>
        )}
        {' · '}
        <span data-testid="lowest-at" data-vendor={lowest.vendor.id}>
          {t.rich('price.lowestAt', {
            vendor: lowest.vendor.name,
            link: (chunks: ReactNode) => (
              <a
                href={vendorAddress(language, lowest.vendor.id)}
                className="hover-underline"
              >
                <AsWritten>{chunks}</AsWritten>
              </a>
            ),
          })}
        </span>
      </>
    );
  };

  return (
    <ul className="@container grid grid-cols-[minmax(0,1fr)]">
      <Item
        place={place}
        nameAlone={whereAPartsNameStands(part.name)}
        picture={<PartSquare part={part} />}
        name={
          part.visible ? (
            <a href={partAddress(language, part.id)} className="hover-underline">
              <AlwaysEnglish>{part.name}</AlwaysEnglish>
            </a>
          ) : (
            <AlwaysEnglish>{part.name}</AlwaysEnglish>
          )
        }
        end={priceOf()}
        second={
          <>
            <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
            {quantityShown && part.quantity !== null && (
              <>
                {' · '}
                <span data-testid="quantity-held" data-quantity={part.quantity}>
                  {shared('quantity', { quantity: formatNumber(part.quantity) })}
                </span>
              </>
            )}
            {whereItIsPriced()}
          </>
        }
      />
    </ul>
  );
}
