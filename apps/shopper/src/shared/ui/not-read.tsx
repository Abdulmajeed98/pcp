import type { Photograph } from '@/shared/photographs';

import { DimPhotograph } from './dim-photograph';
import { Sheet, SheetAction, SheetNote, SheetTitle } from './sheet';

// A page whose Part or Vendor the API did not answer at all (DESIGN.md's A
// Part the API does not answer, and a Vendor's): one sheet, centred over the
// dim photograph the page lies on, that says it cannot be read just now, as
// its title and the page's `h1`, and offers to try again at the same
// address, as a Category page's list does when the API does not answer. It
// is not "not found": the Part or the Vendor may well be there.
export function NotRead({
  photograph,
  title,
  note,
  tryAgain,
  address,
}: {
  photograph: Photograph;
  title: string;
  note: string;
  tryAgain: string;
  address: string;
}) {
  return (
    <main className="relative isolate grid flex-1 justify-items-center px-ground-edge py-section-phone md:page-margins md:py-section">
      <DimPhotograph photograph={photograph} first />
      <Sheet print="arrival">
        <SheetTitle as="h1">{title}</SheetTitle>
        <SheetNote lead>{note}</SheetNote>
        <SheetAction kind="board" address={address} plain testId="try-again">
          {tryAgain}
        </SheetAction>
      </Sheet>
    </main>
  );
}
