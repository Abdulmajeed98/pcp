import { createContext, type ReactNode, use } from 'react';
import { createPortal } from 'react-dom';

// Where a screen's one action goes on a phone: the end side of the frame's
// 56-pixel bar (DESIGN.md's Layout), as Add an Offer is on the Vendor
// portal's Offers screen. The frame gives the place, and the screen puts its
// action there; from 64rem, or in a frame with no such place, the screen
// keeps the action in its own title row.
const ScreenActionPlace = createContext<HTMLElement | null>(null);

function ScreenActionPlaceProvider({
  place,
  children,
}: {
  place: HTMLElement | null;
  children: ReactNode;
}) {
  return <ScreenActionPlace value={place}>{children}</ScreenActionPlace>;
}

// Whether the frame has a place for a screen's action in its bar now.
function useScreenActionPlace(): HTMLElement | null {
  return use(ScreenActionPlace);
}

// Shows a screen's action in the phone's bar when the frame has a place for
// it, and where it is written otherwise.
function ScreenAction({ children }: { children: ReactNode }) {
  const place = useScreenActionPlace();
  return place === null ? children : createPortal(children, place);
}

export { ScreenAction, ScreenActionPlaceProvider, useScreenActionPlace };
