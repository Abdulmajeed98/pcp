import type { ReactNode } from 'react';

// A refusal said in an alert dialog, in Action Red at the small size above
// its buttons (DESIGN.md's Dialogs). Its place is always there, closed while
// there is nothing to say, so that a refusal arriving does not push the
// buttons down in one frame: its space opens, and then it fades in, as a row
// arrives in a list (Motion 8, the No Snap Rule); a refusal cleared for the
// next try leaves the same way. The dialog's gap above it is taken back by
// its own margin and given again inside what opens.
export function AlertDialogRefusal({ children }: { children: ReactNode }) {
  const said = children !== null && children !== undefined && children !== false;

  return (
    <div
      data-leaving={said ? undefined : ''}
      data-arriving={said ? '' : undefined}
      inert={!said}
      className="leaves -mt-4"
    >
      <div>
        <p role="alert" className="pt-4 text-sm text-destructive">
          {children}
        </p>
      </div>
    </div>
  );
}
