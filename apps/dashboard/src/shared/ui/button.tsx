import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

// shadcn/ui's button, in the Mira style, held to the root DESIGN.md: 44
// pixels high in every size, body-size text, and a focus outline drawn in
// `ring` at full strength. The outline variant draws its edge in `input`,
// because that edge is what shows where the button is.
const buttonClasses = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent bg-clip-padding text-base font-medium whitespace-nowrap transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/85',
        outline:
          'border-input bg-transparent hover:bg-secondary aria-expanded:bg-secondary',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary',
        ghost: 'hover:bg-secondary aria-expanded:bg-secondary',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/85',
        link: 'text-primary underline underline-offset-4 hover:decoration-2',
      },
      size: {
        default:
          'h-control px-4 has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3',
        icon: 'size-control',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonClasses>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}

// The button's classes, for a link or a label that looks like a button. The
// variant's classes are merged over the base's, so that a variant's border
// colour wins over the base's transparent one whichever Tailwind writes last.
function buttonVariants(props?: Parameters<typeof buttonClasses>[0]): string {
  return cn(buttonClasses(props));
}

export { Button, buttonVariants };
