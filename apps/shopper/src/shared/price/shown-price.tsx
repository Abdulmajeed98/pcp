import type { ShownPriceResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';

import { shownPriceText } from './shown-price-text';

// The one component that draws a Shown Price (DESIGN.md's The Shown Price,
// with its "≈"): the figure at its line's size and weight 600, in tabular
// figures, its unit after it at 0.72em, never under the Small size, and "≈"
// before it when it is a Converted Price, at the figure's own weight and ink.
// The whole price is one left-to-right unit in every language, kept apart
// from the sentence around it (`AlwaysEnglish`). The Lowest Price, an
// Offer's price and a Build's total all take it.
//
// It breaks in one place only, between its figure and its unit, and only
// where its line cannot hold it whole, as at a phone's largest text: the
// unit then stands under the figure, the "≈" kept with the figure, which
// never breaks inside (the owner's option A, 13 November 2026). The price is
// one box (`inline-flex`), so that a sentence too short for it carries it
// whole to its next line rather than part it there; the box lies on the
// figure's baseline, its first line's, as the price did; and its lines take
// the side its line sets it to (`set-as-its-line`, read against the line's
// direction, not the price's own), so that a wrapped unit stands flush with
// its figure on that side and the price's edge stays straight: at the end
// of an item, at its left in Kurdish and Arabic and at its right in English,
// and at the start of a slip's line stacked on a narrow slip. On a slip's
// line from 48rem, which keeps its name whole, it keeps whole too, as it
// always has there (the theme's `data-slip-line` rules on its lines,
// `data-price-lines`). Its text, and the space between its figure and its
// unit, are as they were, so a screen reader and a copy read
// "≈ 6,824,750 IQD".
export function ShownPrice({
  price,
  className,
}: {
  price: ShownPriceResponse;
  className?: string;
}) {
  const { approximate, figure, unit } = shownPriceText(price);

  return (
    <AlwaysEnglish
      data-testid="shown-price"
      data-currency={price.currency}
      data-converted={price.converted ? '' : undefined}
      className={cn('figures set-as-its-line inline-flex font-semibold', className)}
    >
      <span data-price-lines="" className="whitespace-normal">
        <span className="whitespace-nowrap">
          {approximate && '≈ '}
          {figure}
        </span>{' '}
        <span className="whitespace-nowrap text-[max(0.72em,var(--text-sm))]">{unit}</span>
      </span>
    </AlwaysEnglish>
  );
}
