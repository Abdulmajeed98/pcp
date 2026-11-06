import type { ShownPriceResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';

import { shownPriceText } from './shown-price-text';

// The one component that draws a Shown Price (DESIGN.md's The Shown Price,
// with its "≈"): the figure at its line's size and weight 600, in tabular
// figures, its unit after it at 0.72em, never under the Small size, and "≈"
// before it when it is a Converted Price, at the figure's own weight and ink.
// The whole price is one left-to-right unit in every language, kept apart
// from the sentence around it (`AlwaysEnglish`), and never breaks inside.
// The Lowest Price, an Offer's price and a Build's total all take it.
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
      className={cn('figures font-semibold whitespace-nowrap', className)}
    >
      {approximate && '≈ '}
      {figure} <span className="text-[max(0.72em,var(--text-sm))]">{unit}</span>
    </AlwaysEnglish>
  );
}
