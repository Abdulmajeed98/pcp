import { Input as InputPrimitive } from '@base-ui/react/input';
import { cn } from 'cn';
import type * as React from 'react';

// shadcn/ui's input, in the Mira style, held to the root DESIGN.md: 44
// pixels high, body-size text, its edge in `input`, and a focus outline at
// full strength.
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-control w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base transition-colors file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
