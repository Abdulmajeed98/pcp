import { cva } from 'class-variance-authority';
import { cn } from 'cn';

// The classes of shadcn/ui's button, in the Lyra style, held to the Shopper
// app's DESIGN.md (Buttons and cells), for every link, label and form's own
// button that looks like a button or a cell: square, at least 52 pixels tall
// with 24 pixels of padding at the sides, in the Body type at weight 600, and
// never under 44 pixels each way on a touchscreen. The primary button is
// Print Green with Green's Ink, one to a screen; every other action is a
// cell, on the Board, on Sheet Paper or in the Ink, as its piece gives it.
// Under a hovering pointer and while pressed, each takes its ground one step
// deeper, its words still at 4.5:1 or more, and a press settles it to 0.97
// (Motion 8, `pressable`), which reduced motion leaves at its pressed ground.
// The focus ring is the theme's, at once and at full strength. No component
// of shadcn/ui's draws a Shopper page yet: each action is a plain link or a
// form's own button, which works before any script has loaded.
const buttonClasses = cva(
  'pressable no-callout inline-flex min-h-button min-w-control shrink-0 cursor-pointer items-center justify-center gap-2 rounded-none px-6 text-center text-base font-semibold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      kind: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-pressed active:bg-primary-pressed',
        board:
          'bg-secondary text-secondary-foreground hover:bg-secondary-pressed active:bg-secondary-pressed',
        paper: 'bg-card text-card-foreground hover:bg-secondary active:bg-secondary',
        ink: 'bg-foreground text-background hover:bg-muted-foreground active:bg-muted-foreground',
      },
    },
    defaultVariants: {
      kind: 'primary',
    },
  },
);

// The button's classes, for a link, a label or a form's button that looks
// like a button or a cell. The kind's classes are merged over the base's.
export function buttonVariants(props?: Parameters<typeof buttonClasses>[0]): string {
  return cn(buttonClasses(props));
}
