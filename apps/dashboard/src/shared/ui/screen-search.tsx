import { createContext, type ReactNode, use } from 'react';
import { createPortal } from 'react-dom';

// Where a screen's own search goes on a screen as wide as a desk's: the
// centre of the frame's top bar (DESIGN.md's Layout). The frame gives the
// place, and the screen puts its search there; on a phone, or in a frame
// with no such place, the screen keeps its search in its own sheet.
const ScreenSearchPlace = createContext<HTMLElement | null>(null);

function ScreenSearchPlaceProvider({
  place,
  children,
}: {
  place: HTMLElement | null;
  children: ReactNode;
}) {
  return <ScreenSearchPlace value={place}>{children}</ScreenSearchPlace>;
}

// Whether the frame has a place for a screen's search in its top bar now.
function useScreenSearchPlace(): HTMLElement | null {
  return use(ScreenSearchPlace);
}

// Shows a screen's search in the top bar's centre when the frame has a place
// for it, and where it is written otherwise.
function ScreenSearch({ children }: { children: ReactNode }) {
  const place = useScreenSearchPlace();
  return place === null ? children : createPortal(children, place);
}

export { ScreenSearch, ScreenSearchPlaceProvider, useScreenSearchPlace };
