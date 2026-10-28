import { cn } from 'cn';

// The mark of a deactivated Vendor, said in words, on a Raised Stone ground
// with 4-pixel corners, as the mark of a needed specification is. It is the
// Admin console's, in English. In a table's column, whose other rows say
// "Active", it is given `className` to pull its padding out past the
// column's edge, so that its word starts where theirs do.
export function DeactivatedMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'rounded-plate bg-secondary px-1.5 text-sm font-medium text-secondary-foreground',
        className,
      )}
    >
      Deactivated
    </span>
  );
}
