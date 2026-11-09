import type { BuildResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';

import { vendorAddress } from '@/entities/vendor';
import { underlinedAction } from '@/features/change-the-build';
import { photographs } from '@/shared/photographs';
import { ShownPrice, shownPriceText } from '@/shared/price';
import {
  buttonVariants,
  DimPhotograph,
  Item,
  type NameAlone,
  Sheet,
  SheetNote,
  SheetTitle,
  whereAPartsNameStands,
} from '@/shared/ui';

type Vendor = BuildResponse['vendors'][number];
type Part = BuildResponse['parts'][number];

// How many Vendors show before the rest fold (DESIGN.md's The Vendors'
// sheet).
const shownBeforeTheFold = 5;

// How many characters of a Vendor's name and its total a line holds side by
// side, on a 360-pixel phone's sheet and on a desk's, as an Offer's on a
// Part page.
const sideBySideOnAPhone = 26;
const sideBySide = 52;

// The Vendors' sheet (DESIGN.md's The Vendors' sheet), the second price view
// (BLD-8), centred over the dim photograph of a water-cooled PC below the
// rules' sheet: the printed sheet titled "Buy from one Vendor", its note
// saying what each total is and that no Vendor pays for its place (OFF-11).
// Each Vendor, in the API's order, which the page never changes, is a line:
// its name as it wrote it, in its own direction, as a link to its Vendor
// page, the leader, and its total, drawn by the Shown Price, "≈" when
// converted; its second line, how many of the Build's Parts it has and how
// many it lacks, or that it has every one; and under it "Its Parts", a
// disclosure that unfolds what it has, each Part's name in English and its
// price times its quantity, and under "Not there" the Parts it lacks. The
// first Vendor comes unfolded; past the fifth the others fold behind a cell
// of the Board. The sheet closes with how many Parts no Vendor has in stock,
// which are in no Vendor's list, and with what "≈" means when a total is
// converted. A Build no Vendor stocks any Part of has no Vendors' sheet.
//
// Each Vendor's line is where `sharing`'s "send on WhatsApp" will stand
// (SHR-5): it is a list item of its own, `data-vendor` naming its Vendor.
// It is below the first screen, so it prints as it comes into view (Motion
// 1); each line and each total a change in place may bring or alter is
// named for the page's script (Motion 11).
export async function VendorsSheet({ answer }: { answer: BuildResponse }) {
  const [language, t, categoryPage] = await Promise.all([
    getLocale(),
    getTranslations('BuildPage.vendors'),
    getTranslations('CategoryPage'),
  ]);
  const parts = new Map(answer.parts.map((part) => [part.id, part]));
  const unstocked = answer.parts.filter((part) => part.unstocked).length;
  const shown = answer.vendors.slice(0, shownBeforeTheFold);
  const folded = answer.vendors.slice(shown.length);
  const line = (vendor: Vendor, place: number) => (
    <VendorLine
      key={vendor.id}
      vendor={vendor}
      parts={parts}
      place={place}
      address={vendorAddress(language, vendor.id)}
    />
  );

  return (
    <section
      aria-labelledby="vendors-title"
      className="relative isolate px-ground-edge py-section-phone md:page-margins md:py-section"
    >
      <DimPhotograph photograph={photographs.waterCooledPc} />
      <div
        id="vendors"
        className="mx-auto grid w-full max-w-[40rem] scroll-mt-6 justify-items-center"
      >
        <Sheet print="in-view">
          <SheetTitle id="vendors-title">{t('title')}</SheetTitle>
          <SheetNote>{t('note')}</SheetNote>
          <div data-space="vendors" className="grid grid-cols-[minmax(0,1fr)]">
            <ul className="mt-group grid grid-cols-[minmax(0,1fr)] gap-7">
              {shown.map(line)}
            </ul>
            {folded.length > 0 && (
              <details data-testid="more-vendors" className="unfolds-in-place mt-7">
                <summary
                  className={buttonVariants({
                    kind: 'board',
                    className: 'w-full list-none [&::-webkit-details-marker]:hidden',
                  })}
                >
                  {t('showTheOthers', {
                    count: folded.length,
                    countText: formatNumber(folded.length),
                  })}
                </summary>
                <ul className="mt-7 grid grid-cols-[minmax(0,1fr)] gap-7">
                  {folded.map((vendor, place) => line(vendor, shown.length + place))}
                </ul>
              </details>
            )}
            {unstocked > 0 && (
              <p
                data-testid="unstocked-in-no-list"
                className="mx-auto mt-group max-w-[34rem] text-center text-muted-foreground"
              >
                {t('unstocked', { count: unstocked, countText: formatNumber(unstocked) })}
              </p>
            )}
            {answer.vendors.some((vendor) => vendor.total?.converted === true) && (
              <p
                data-testid="what-approximately-means"
                className="mx-auto mt-3 max-w-[34rem] text-center text-muted-foreground"
              >
                {categoryPage('approximately')}
              </p>
            )}
          </div>
        </Sheet>
      </div>
    </section>
  );
}

// One Vendor of the second price view, with its total, what it has of the
// Build and what it lacks.
async function VendorLine({
  vendor,
  parts,
  place,
  address,
}: {
  vendor: Vendor;
  parts: ReadonlyMap<string, Part>;
  place: number;
  address: string;
}) {
  const t = await getTranslations('BuildPage.vendors');
  const has = vendor.partsInStock.length;
  const lacks = vendor.partsLacked.length;
  const total = vendor.total === null ? undefined : shownPriceText(vendor.total);
  const together =
    vendor.name.length +
    (total === undefined
      ? 1
      : `${total.approximate ? '≈ ' : ''}${total.figure} ${total.unit}`.length);
  const nameAlone: NameAlone | undefined =
    together > sideBySide
      ? 'always'
      : together > sideBySideOnAPhone
        ? 'on-a-phone'
        : undefined;

  return (
    <li
      data-line={`vendor-${vendor.id}`}
      data-testid="build-vendor"
      data-vendor={vendor.id}
      className="grid grid-cols-[minmax(0,1fr)] gap-1"
    >
      <ul className="@container grid grid-cols-[minmax(0,1fr)]">
        <Item
          data={{ 'data-item': 'text' }}
          place={place}
          nameAlone={nameAlone}
          name={
            <a href={address} className="hover-underline">
              <AsWritten>{vendor.name}</AsWritten>
            </a>
          }
          end={
            <span data-figure={`vendor-${vendor.id}`} data-testid="vendor-total">
              {vendor.total === null ? '—' : <ShownPrice price={vendor.total} />}
            </span>
          }
          second={
            <span data-testid="vendor-has">
              {lacks === 0
                ? t('hasEvery')
                : t('has', {
                    count: has + lacks,
                    countText: formatNumber(has + lacks),
                    hasText: formatNumber(has),
                    lacksText: formatNumber(lacks),
                  })}
            </span>
          }
        />
      </ul>
      <details
        open={place === 0 || undefined}
        data-testid="vendor-parts"
        className="unfolds-in-place"
      >
        <summary
          className={`${underlinedAction} pressable no-callout list-none [&::-webkit-details-marker]:hidden`}
        >
          {t('itsParts')}
        </summary>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 pt-3">
          <p className="text-sm font-semibold text-muted-foreground">{t('inStockThere')}</p>
          <ul className="@container grid grid-cols-[minmax(0,1fr)] gap-2.5">
            {vendor.partsInStock.map((inStock, at) => {
              const part = parts.get(inStock.partId);
              if (part === undefined) return null;
              return (
                <Item
                  key={part.id}
                  testId="vendor-has-part"
                  data={{ 'data-item': 'text', 'data-part': part.id }}
                  place={at}
                  className="text-base"
                  nameAlone={whereAPartsNameStands(part.name)}
                  name={<AlwaysEnglish>{part.name}</AlwaysEnglish>}
                  end={
                    inStock.timesQuantity === null ? (
                      '—'
                    ) : (
                      <ShownPrice price={inStock.timesQuantity} />
                    )
                  }
                  second={
                    part.quantity !== null &&
                    part.quantity > 1 &&
                    inStock.shownPrice !== null ? (
                      <AlwaysEnglish>
                        {formatNumber(part.quantity)} ×{' '}
                        <ShownPrice price={inStock.shownPrice} className="font-normal" />
                      </AlwaysEnglish>
                    ) : undefined
                  }
                />
              );
            })}
          </ul>
          {lacks > 0 && (
            <>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {t('notThere')}
              </p>
              <ul
                data-testid="vendor-lacks"
                className="grid grid-cols-[minmax(0,1fr)] gap-1.5 text-base text-muted-foreground"
              >
                {vendor.partsLacked.map((id) => {
                  const part = parts.get(id);
                  return part === undefined ? null : (
                    <li key={id} data-part={id} className="min-w-0 wrap-break-word">
                      <AlwaysEnglish>{part.name}</AlwaysEnglish>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </details>
    </li>
  );
}
