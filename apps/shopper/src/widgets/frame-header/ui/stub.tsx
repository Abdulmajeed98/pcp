import { NameSlot } from './name-slot';
import { Switches } from './switches';

// The frame's header on every page but the home page, the stub (DESIGN.md's
// Its header, the stub): a strip of Sheet Paper across the top of the page,
// its lower edge a perforation, 8 pixels of padding above and below and the
// page's margins at its sides, kept clear of a phone's notch. The name slot
// is on the start side and the switches on the end side; below 48rem the
// name has its row and the switches one row under it.
export function Stub() {
  return (
    <header
      data-testid="frame-header"
      className="perforated-below page-margins flex flex-col items-start gap-x-6 bg-card pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-card-foreground md:flex-row md:flex-wrap md:items-center md:justify-between"
    >
      <NameSlot />
      <Switches />
    </header>
  );
}
