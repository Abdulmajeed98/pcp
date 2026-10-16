import { cn } from 'cn';
import type * as React from 'react';

// shadcn/ui's label, in the Mira style, at the small size: the root
// DESIGN.md sets no text under 14 pixels. It always names the control it
// labels, by the control's `id`, so that the control has a name.
function Label({
  className,
  htmlFor,
  ...props
}: React.ComponentProps<'label'> & { htmlFor: string }) {
  return (
    <label
      htmlFor={htmlFor}
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
