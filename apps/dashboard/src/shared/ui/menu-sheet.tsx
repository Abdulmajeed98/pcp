import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { MenuIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from './button';

// The menu sheet, a frame's navigation on a phone (DESIGN.md's Navigation and
// the frame): a menu button opens a panel from the start side, on the Stone
// Frame, as tall as the screen and at most 20rem wide, over a scrim that dims
// the screen. It holds the surface's name at its head, then what the frame
// gives it. It is Base UI's dialog, so choosing a section, tapping the scrim,
// the menu button again or Escape closes it, and focus returns to the menu
// button. It moves as Motion 5 says.
function MenuSheet({
  label,
  title,
  open,
  onOpenChange,
  children,
}: {
  // What the menu button is named, such as "Sections".
  label: string;
  // The surface's name, at the head of the sheet, which names it.
  title: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger
        render={<Button variant="ghost" size="icon" aria-label={label} className="-ms-2" />}
      >
        <MenuIcon aria-hidden="true" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="scrim-motion fixed inset-0 z-50 bg-black/40" />
        <DialogPrimitive.Popup className="menu-sheet-motion fixed inset-y-0 start-0 z-50 flex w-[min(20rem,calc(100%-3rem))] flex-col gap-5 overflow-y-auto overscroll-contain border-e border-border bg-frame p-4 wrap-break-word text-foreground shadow-floating outline-none">
          <DialogPrimitive.Title className="flex min-h-control items-center font-semibold">
            {title}
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { MenuSheet };
