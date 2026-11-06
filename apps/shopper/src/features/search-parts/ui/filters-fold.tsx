import type { FilterResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { Category } from '@/entities/category';
import { currencyMarks } from '@/shared/currency';
import { shownPriceText } from '@/shared/price';
import { buttonVariants } from '@/shared/ui';

import {
  type CategoryQuery,
  categoryPageAddress,
  choicesOn,
  type FilterValue,
  nothingOn,
  type OfferedFilters,
  type PriceEnd,
} from '../model/category-query';
import { isNamed, nameOfFilter, type SearchWords, wordsOfAValue } from './value-words';

// The filters of a Category page (DESIGN.md's The filters, and The filters
// with a thumb), built from the API's answer of the Category's filters, so
// that the Shopper app holds no list of them: each filter a field set with
// its legend at weight 600, the manufacturer first, then the Category's key
// specifications, each value a chip; then the price range; then Show Parts,
// the primary button, and Clear all, a cell, side by side at the tag's foot.
// A filter the answer leaves out, having no values, is not drawn, nor is the
// price range when no Visible Part has a Lowest Price.
//
// It is a disclosure, which works before any script has loaded. Below 64rem
// it is folded behind a bar as wide as the sheet and 52 pixels tall, which
// says "Filters" and how many choices are on, the search's words aside; a tap
// on it unfolds the swing tag in place above the sheet, over 250 ms, and
// folds it in 150 ms (Motion 10, `unfolds`). From 64rem the tag is always
// unfolded beside the sheet and the bar is not drawn (`fold-bar`), where the
// browser can show a disclosure's contents while it is folded; where it
// cannot, the bar stays, and a tap unfolds the tag there too.
export async function FiltersFold({
  category,
  query,
  offered,
  range,
}: {
  category: Category;
  query: CategoryQuery;
  offered: OfferedFilters | undefined;
  range: { lowest: PriceEnd; highest: PriceEnd };
}) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('SearchParts')]);
  const on = choicesOn(query).filter(({ kind }) => kind !== 'search').length;
  const chosen = (parameter: string) =>
    parameter === 'manufacturer'
      ? query.manufacturers
      : (query.filters.find((filter) => filter.parameter === parameter)?.values ?? []);

  return (
    <details data-testid="filters-fold" className="unfolds">
      <summary
        data-testid="filters-bar"
        className="fold-bar pressable no-callout flex min-h-button cursor-pointer list-none items-center justify-between gap-4 bg-card px-[18px] font-semibold text-card-foreground hover:bg-secondary active:bg-secondary [&::-webkit-details-marker]:hidden"
      >
        <span>{t('title')}</span>
        <span
          aria-hidden="true"
          data-testid="choices-on-count"
          className="figures min-w-6 text-center"
        >
          {formatNumber(on)}
        </span>
        <span className="sr-only">
          {t('choicesOnCount', { count: on, countText: formatNumber(on) })}
        </span>
      </summary>
      <div
        data-testid="swing-tag"
        className="grid gap-6 text-card-foreground max-lg:mt-2.5 max-lg:bg-card max-lg:px-8 max-lg:pt-14 max-lg:pb-8 max-lg:punched-hole"
      >
        {offered !== undefined && offered.manufacturers.length > 0 && (
          <Choices
            legend={t('manufacturer')}
            filter={{ parameter: 'manufacturer', kind: 'text' }}
            values={offered.manufacturers}
            chosen={chosen('manufacturer')}
            t={t}
          />
        )}
        {offered?.filters.flatMap((filter) =>
          isNamed(filter.parameter, t)
            ? [
                <Choices
                  key={filter.parameter}
                  legend={nameOfFilter(filter.parameter, t)}
                  filter={filter}
                  values={filter.values}
                  chosen={chosen(filter.parameter)}
                  t={t}
                />,
              ]
            : [],
        )}
        {offered?.priceRange.lowest != null && offered.priceRange.highest != null && (
          <fieldset className="grid">
            <legend className="mb-2 font-semibold">
              {t.rich('price', {
                unit: currencyMarks[offered.priceRange.currency],
                english: (chunks) => <AlwaysEnglish>{chunks}</AlwaysEnglish>,
              })}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(['lowest', 'highest'] as const).map((end) => (
                <PriceField
                  key={end}
                  end={end}
                  label={t(end)}
                  hint={
                    shownPriceText({
                      currency: offered.priceRange.currency,
                      amount: offered.priceRange[end] ?? '',
                      converted: false,
                    }).figure
                  }
                  typed={range[end]}
                  problem={
                    range[end].problem === null
                      ? null
                      : t(`priceProblems.${range[end].problem}`)
                  }
                />
              ))}
            </div>
          </fieldset>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            data-testid="show-parts"
            className={buttonVariants({ kind: 'primary', className: atTheFoot })}
          >
            {t('show')}
          </button>
          <Link
            href={categoryPageAddress(language, category, nothingOn)}
            prefetch={false}
            data-testid="clear-all-filters"
            className={buttonVariants({ kind: 'board', className: atTheFoot })}
          >
            {t('clearAll')}
          </Link>
        </div>
      </div>
    </details>
  );
}

// Show Parts and Clear all at the tag's foot: side by side, each half the
// tag's width, while both their words fit on one line, and each across the
// whole tag, one above the other, where they do not, as at 1024 pixels in
// Kurdish, rather than wrap inside a button; their words wrap only where even
// the whole tag cannot hold them on one line, as with text at twice its size.
const atTheFoot = 'min-w-fit flex-[1_1_calc(50%-0.25rem)] px-3';

// A long filter shows its first 12 values and folds the rest, so that the
// price range and Show Parts stay within reach: the made-up shop's 400 GPUs
// hold 149 chipsets, a tag some 6,000 pixels tall on a phone (break-ui,
// ticket 11). A filter of up to 16 values shows them all, rather than fold
// away a few.
const valuesShown = 12;
const valuesFoldedPast = 16;

// One filter's field set: its legend at weight 600, and each of its values
// a chip, a native checkbox drawn as a square of the Board, 44 pixels tall
// on a touchscreen, its words in the Ink; a chosen one turns to Print Green
// with Green's Ink and a check mark before its words, so that its state is in
// a mark as well as a colour. The chips wrap in rows. Each is named by its
// words, in the field set named by its filter.
//
// The values of a long filter past its first 12 are folded behind a
// disclosure of their own, which works before any script has loaded: its
// summary, underlined as Clear all is, says how many more there are, "137
// more", and "Fewer" once it is open. It is open from the first when a value
// it folds is chosen, so that no chosen chip is hidden.
function Choices({
  legend,
  filter,
  values,
  chosen,
  t,
}: {
  legend: string;
  filter: Pick<FilterResponse, 'parameter' | 'kind' | 'unit'>;
  values: readonly FilterValue[];
  chosen: readonly FilterValue[];
  t: SearchWords;
}) {
  const shown = values.length > valuesFoldedPast ? values.slice(0, valuesShown) : values;
  const folded = values.slice(shown.length);
  const chips = (some: readonly FilterValue[]) => (
    <div className="flex flex-wrap gap-1.5">
      {some.map((value) => (
        <Chip
          key={String(value)}
          parameter={filter.parameter}
          value={value}
          chosen={chosen.includes(value)}
        >
          {wordsOfAValue(filter, value, t).words}
        </Chip>
      ))}
    </div>
  );

  return (
    <fieldset className="grid" data-filter={filter.parameter}>
      <legend className="mb-2 font-semibold">{legend}</legend>
      {chips(shown)}
      {folded.length > 0 && (
        <details
          data-testid="more-values"
          open={folded.some((value) => chosen.includes(value)) || undefined}
          className="group/more mt-1.5"
        >
          <summary className="pressable no-callout inline-flex min-h-control cursor-pointer list-none items-center font-semibold [&::-webkit-details-marker]:hidden">
            <span className="hover-underline group-open/more:hidden">
              {t('moreValues', {
                count: folded.length,
                countText: formatNumber(folded.length),
              })}
            </span>
            <span className="hover-underline hidden group-open/more:inline">
              {t('fewerValues')}
            </span>
          </summary>
          <div className="mt-1.5">{chips(folded)}</div>
        </details>
      )}
    </fieldset>
  );
}

function Chip({
  parameter,
  value,
  chosen,
  children,
}: {
  parameter: string;
  value: FilterValue;
  chosen: boolean;
  children: ReactNode;
}) {
  return (
    <label className="group/chip pressable no-callout relative inline-flex min-h-control max-w-full min-w-control cursor-pointer items-center justify-center gap-1.5 bg-secondary px-3.5 text-foreground hover:bg-secondary-pressed has-checked:bg-primary has-checked:text-primary-foreground has-checked:hover:bg-primary-pressed has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
      <input
        type="checkbox"
        name={parameter}
        value={String(value)}
        defaultChecked={chosen}
        className="sr-only"
      />
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="hidden size-4 shrink-0 group-has-checked/chip:block"
      >
        <path
          d="M2.5 8.5 L6.5 12.5 L13.5 4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.25}
          strokeLinecap="square"
        />
      </svg>
      <span className="min-w-0 wrap-anywhere">{children}</span>
    </label>
  );
}

// One end of the price range: its name, "Lowest" or "Highest", above a field
// that takes Western or Arabic-Indic digits from the phone's number pad, with
// the end of the Category's range of Lowest Prices as its hint, in Western
// digits; and beside it, under the field, why what was typed is not used,
// which a screen reader hears as the field's description, and as it changes.
// The field shows what was typed when it cannot be used, so that it can be
// corrected, and what was read, in Western digits, when it is.
function PriceField({
  end,
  label,
  hint,
  typed,
  problem,
}: {
  end: 'lowest' | 'highest';
  label: string;
  hint: string;
  typed: PriceEnd;
  problem: string | null;
}) {
  const id = `price-${end}`;
  const said = `price-${end}-problem`;
  return (
    <div className="grid min-w-0 content-start gap-1">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        name={end}
        type="text"
        inputMode="numeric"
        dir="auto"
        autoComplete="off"
        enterKeyHint="go"
        defaultValue={typed.value === null ? typed.typed : formatNumber(typed.value)}
        placeholder={hint}
        aria-invalid={problem === null ? undefined : true}
        aria-describedby={said}
        className="figures min-h-input w-full min-w-0 appearance-none rounded-none border-0 border-b-[3px] border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground"
      />
      <p id={said} data-testid={`${end}-problem`} aria-live="polite" className="text-sm">
        {problem}
      </p>
    </div>
  );
}
