import { cn } from 'cn';
import type * as React from 'react';

// shadcn/ui's textarea, in the Mira style, held to the root DESIGN.md as the
// input is: at least 96 pixels high, room for three lines, and growing with
// what is written in it, body-size text, its edge in `input`, and a focus
// outline at full strength.
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content flex min-h-24 w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-base transition-colors placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
