import { Input as InputPrimitive } from '@base-ui/react/input';
import { cn } from 'cn';
import type * as React from 'react';

// shadcn/ui's input, in the Mira style, held to the dashboard's DESIGN.md:
// as high as a control, 44 pixels on a touchscreen and 36 under a mouse, on
// the Sheet with 6-pixel corners and its edge in `input`, and a focus
// outline at full strength. Its text keeps the body size, 16 pixels (17 in
// Kurdish and Arabic), at every width, so that a phone does not zoom into
// it.
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-control w-full min-w-0 rounded-control border border-input bg-background px-3 text-base file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
