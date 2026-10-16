import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';
import type * as React from 'react';

// shadcn/ui's native select, in the Mira style, held to the root DESIGN.md:
// 44 pixels high, body-size text, its edge in `input`, and a focus outline at
// full strength. It is the browser's own select, so a phone opens its own
// picker. The chevron sits on the end side, which `pe-` keeps clear.
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <div
      className={cn(
        'group/native-select relative w-fit has-[select:disabled]:opacity-50',
        className,
      )}
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        className="h-control w-full min-w-0 appearance-none rounded-md border border-input bg-card ps-3 pe-9 text-base transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive"
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<'option'>) {
  return (
    <option
      data-slot="native-select-option"
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<'optgroup'>) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
