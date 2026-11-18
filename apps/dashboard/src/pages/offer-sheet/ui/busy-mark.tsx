import { LoaderCircleIcon, type LucideIcon } from 'lucide-react';

// A button's mark, which turns while its file is on its way, an Offer
// sheet's download or upload, a wait that can run for seconds: lucide's
// `LoaderCircle`, one turn in 800 ms on a linear curve, the one constant
// motion of the portal, since a wait with nothing moving reads as stuck
// (DESIGN.md's Buttons and Motion 13, the owner's d6). With reduced motion
// it stays still, and the button's words alone say it.
export function BusyMark({ busy, Icon }: { busy: boolean; Icon: LucideIcon }) {
  return busy ? (
    <LoaderCircleIcon
      data-icon="inline-start"
      aria-hidden="true"
      className="animate-spin [animation-duration:800ms] motion-reduce:animate-none"
    />
  ) : (
    <Icon data-icon="inline-start" aria-hidden="true" />
  );
}
