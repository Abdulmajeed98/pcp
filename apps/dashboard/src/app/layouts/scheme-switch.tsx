import { cn } from 'cn';
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';

import { chooseScheme, type Scheme, schemes, useScheme } from '@/shared/lib';

const icons = { light: SunIcon, dark: MoonIcon, device: MonitorIcon } as const;

// The scheme switch, in both halves of the dashboard (DESIGN.md's Inputs and
// choices): segmented, one rectangle with 6-pixel corners and a Control Edge
// border, holding three icon segments, each named, Light, Dark and Device;
// the chosen one on Active Stone and pressed. Each segment is a control's
// height square, 44 pixels on a touchscreen and 36 under a mouse.
//
// A tap changes every colour at once, and is remembered in this browser. Its
// words are the Admin console's, in English, unless the Vendor portal gives
// its own, in the portal's language.
export function SchemeSwitch({
  words = { label: 'Colour scheme', light: 'Light', dark: 'Dark', device: 'Device' },
  className,
}: {
  words?: { label: string } & Record<Scheme, string>;
  className?: string;
}) {
  const shown = useScheme();

  return (
    <fieldset
      data-testid="scheme-switch"
      className={cn(
        'relative inline-flex shrink-0 rounded-control border border-input',
        className,
      )}
    >
      <legend className="sr-only">{words.label}</legend>
      {schemes.map((scheme) => {
        const Icon = icons[scheme];
        return (
          <button
            key={scheme}
            type="button"
            data-testid={`scheme-${scheme}`}
            aria-label={words[scheme]}
            title={words[scheme]}
            aria-pressed={scheme === shown}
            className="pressable flex size-control items-center justify-center rounded-[calc(var(--radius-control)-1px)] text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:bg-accent aria-pressed:text-foreground"
            onClick={() => chooseScheme(scheme)}
          >
            <Icon aria-hidden="true" className="size-4" />
          </button>
        );
      })}
    </fieldset>
  );
}
