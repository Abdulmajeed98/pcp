import type { BuildPartResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten, CategoryIcon } from '@pcp/ui';
import { cn } from 'cn';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import {
  type Category,
  isKitOrDrive,
  mostKitsOrDrives,
  mostOfOne,
  type Refusal,
} from '@/entities/build';
import { partAddress, PartSquare } from '@/entities/part';
import { vendorAddress } from '@/entities/vendor';
import {
  pickerAddress,
  placeOf,
  QuantityForm,
  RemoveForm,
  underlinedAction,
} from '@/features/change-the-build';
import { ShownPrice } from '@/shared/price';
import { buttonVariants, Item, whereAPartsNameStands } from '@/shared/ui';

// A Category on the Build's sheet (DESIGN.md's A Category on the Build's
// sheet): the Category's icon at 20 pixels and its name, in Body at 600 in
// Soft Ink, head its place, which an address leads to after a change
// (`#ram`). Under it each of its Parts is printed as a Part on a Category
// page is, its photo or its Category's icon in the small square, its name in
// English as a link to its Part page (a Visible Part only), the leader, its
// price at the end, and its second line, its manufacturer and where its
// Lowest Price comes from; a long name keeps the Long Name Rule. Under the
// line, from the start of its words, its controls: Change,
// a link to its picker, or a kit's or a drive's quantity, at the start, and
// Remove at the end, never side by side. Several kits or drives follow one
// another 8 pixels apart, and under the last, while fewer than 8, Add
// another, a link to the picker.
//
// A Category with no Part is one cell of the Board across its place, a link
// to its picker; a GPU or a CPU cooler the CPU makes unneeded says so, with
// a link to choose one all the same. A Part the API left out, which the
// catalog no longer holds, leaves its Category not chosen.
//
// Each line the Build may gain or lose is named for the page's script
// (`data-line`), and so is the place's space (`data-space`), which the
// script moves when a change applies in place (Motion 11).
export async function CategoryPlace({
  category,
  parts,
  firstPlace,
  notNeeded,
  refused,
}: {
  category: Category;
  parts: readonly BuildPartResponse[];
  // The place of the Category's first Part on the sheet, from 0, which
  // staggers its price as the sheet prints (Motion 2).
  firstPlace: number;
  notNeeded: boolean;
  refused: Refusal | undefined;
}) {
  const [language, t, categoryName] = await Promise.all([
    getLocale(),
    getTranslations('BuildPage'),
    getTranslations('Category'),
  ]);

  // A Part's price on the Build's sheet (DESIGN.md's A Part's price on the
  // Build's sheet), the first price view (BLD-7): its Lowest Price times its
  // quantity, as the API answers it, drawn by the Shown Price with its "≈",
  // so that the sheet's column adds up to the slip's total; for an Unstocked
  // Part, "No Vendor has it" in words in the price's place, never a colour
  // alone; and nothing for a Part whose price cannot be shown yet, as a
  // Category page shows none. Each price is named for the page's script,
  // which settles it again when a change in place alters it (Motion 11).
  const priceOf = (part: BuildPartResponse) => {
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
  const whereItIsPriced = (part: BuildPartResponse) => {
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
  const place = placeOf(category);
  const heading = `${place}-heading`;
  const picker = pickerAddress(language, category);
  const most = { most: formatNumber(mostOfOne), least: formatNumber(1) };
  // Under a stacked line its controls start under its picture: the start
  // of its words is past the square, 40 pixels on a phone and 48 from 48rem,
  // and its margin.
  const fromTheWords = 'ps-[3.25rem] md:ps-[3.75rem]';

  return (
    <li
      id={place}
      data-space={category}
      data-testid={`build-category-${category}`}
      className="@container grid scroll-mt-6 grid-cols-[minmax(0,1fr)] gap-2"
    >
      <h3
        id={heading}
        tabIndex={-1}
        className="flex items-center gap-2 text-base font-semibold text-muted-foreground"
      >
        <CategoryIcon category={category} size={20} className="shrink-0" />
        <span>{categoryName(category)}</span>
      </h3>

      {parts.map((part, at) => (
        <div
          key={part.id}
          data-line={`part-${part.id}`}
          data-testid="build-part"
          data-part={part.id}
          className="grid grid-cols-[minmax(0,1fr)] gap-1"
        >
          <ul className="@container grid grid-cols-[minmax(0,1fr)]">
            <Item
              place={firstPlace + at}
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
              end={priceOf(part)}
              second={
                <>
                  <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
                  {whereItIsPriced(part)}
                </>
              }
            />
          </ul>
          <div
            data-controls=""
            className={cn(
              'flex flex-wrap items-center justify-between gap-x-6 gap-y-1',
              fromTheWords,
            )}
          >
            {part.quantity === null ? (
              <a
                href={picker}
                aria-label={t('changeThe', { category })}
                className={underlinedAction}
              >
                {t('change')}
              </a>
            ) : (
              <QuantityForm
                action={`/${language}/build/quantity`}
                part={part.id}
                quantity={part.quantity}
                refused={
                  refused === undefined || !('part' in refused) || refused.part !== part.id
                    ? undefined
                    : refused.reason === 'mostOfOne'
                      ? t('refused.mostOfOne', most)
                      : t('refused.notAQuantity', most)
                }
                words={{
                  label: t('quantity.of', { part: part.name }),
                  figure: t('quantity.figure'),
                  oneFewer: t('quantity.oneFewer'),
                  oneMore: t('quantity.oneMore'),
                  set: t('quantity.set'),
                  notAQuantity: t('refused.notAQuantity', most),
                }}
              />
            )}
            <RemoveForm
              action={`/${language}/build/remove`}
              part={part.id}
              line={`part-${part.id}`}
              focusAfter={heading}
              label={t('removeThe', { part: part.name })}
            >
              {t('remove')}
            </RemoveForm>
          </div>
        </div>
      ))}

      {isKitOrDrive(category) && parts.length > 0 && parts.length < mostKitsOrDrives && (
        <a
          href={picker}
          data-controls=""
          className={cn(underlinedAction, 'justify-self-start', fromTheWords)}
        >
          {t('addAnother', { category })}
        </a>
      )}

      {refused?.reason === 'mostKitsOrDrives' && refused.category === category && (
        <p data-testid="refused" data-controls="" className={cn('text-base', fromTheWords)}>
          {t('refused.mostKitsOrDrives', {
            category,
            most: formatNumber(mostKitsOrDrives),
          })}
        </p>
      )}

      {parts.length === 0 &&
        (notNeeded ? (
          <div
            data-line={`not-needed-${category}`}
            data-testid="not-needed"
            className="grid grid-cols-[minmax(0,1fr)] gap-1 ps-7"
          >
            <p className="text-base text-muted-foreground">
              {t('notNeeded', { category })}
            </p>
            <a href={picker} className={cn(underlinedAction, 'justify-self-start')}>
              {t('choose', { category })}
            </a>
          </div>
        ) : (
          <div data-line={`choose-${category}`} className="grid grid-cols-[minmax(0,1fr)]">
            <a
              href={picker}
              data-testid="choose"
              className={buttonVariants({ kind: 'board', className: 'w-full' })}
            >
              {t('choose', { category })}
            </a>
          </div>
        ))}
    </li>
  );
}
