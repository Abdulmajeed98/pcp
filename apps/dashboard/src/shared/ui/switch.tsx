import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cn } from 'cn';

// shadcn/ui's switch, on Base UI, held to the root DESIGN.md: a track 24
// pixels high and 44 wide, which takes a tap 44 pixels high, in Control Edge
// when off, at 3:1 against the page, and in Ink when on; a focus outline at
// full strength. Its thumb moves to the end side when it is on, in either
// direction. Its size variants are left out.
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer group/switch relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors after:absolute after:-inset-y-2.5 after:inset-x-0 focus-visible:outline-2 focus-visible:outline-offset-2 aria-invalid:ring-1 aria-invalid:ring-destructive data-checked:bg-primary data-unchecked:bg-input data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-background transition-transform data-checked:translate-x-5 data-unchecked:translate-x-0 rtl:data-checked:-translate-x-5"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
