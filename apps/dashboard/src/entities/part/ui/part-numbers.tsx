import type { PartSummaryResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';

// A Part's part numbers, in Geist Mono at the small size in Note Grey, left
// to right in every language (LANG-3). Each is kept whole on its line, as
// the number on a box is read whole, and wraps inside itself only when it is
// longer than the line (redesign ticket 07's break-ui). Nothing is drawn for
// a Part with none.
export function PartNumbers({
  part,
  className,
}: {
  part: Pick<PartSummaryResponse, 'partNumbers'>;
  className?: string;
}) {
  if (part.partNumbers.length === 0) return null;

  return (
    <AlwaysEnglish
      data-testid="part-numbers"
      className={cn('font-mono text-sm text-muted-foreground', className)}
    >
      {part.partNumbers.map((partNumber, index) => (
        <span key={index}>
          {index > 0 && ' '}
          <span className="inline-block max-w-full wrap-anywhere">
            {partNumber}
            {index < part.partNumbers.length - 1 && ','}
          </span>
        </span>
      ))}
    </AlwaysEnglish>
  );
}
