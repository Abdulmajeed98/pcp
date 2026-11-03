import { useCallback, useLayoutEffect, useRef } from 'react';

// Centres what an element holds in the window's height, while the element
// stays where the screen puts it, on the sheet inside its frame: the element
// reaches down to the foot of the window, less what its frame keeps below
// it, and is padded at its foot by as much as the frame takes above it, so
// that its content, centred in it, stands at the window's middle. Used for
// an empty state that is the whole screen, such as a "not found" screen or
// a plain message, as the owner chose in redesign ticket 13. A content
// taller than the room left simply takes its own height.
//
// It gives a ref to put on the element. The element is measured as soon as
// it is in the page, before the browser paints, and again whenever the page
// changes size, such as when the window does, as when it crosses from a
// phone's width to a desk's and the frame changes around the element, or
// the frame above it takes another height in another language. A measure
// that changes nothing changes no size, so it settles at once.
export function useCentredInTheWindow<Element extends HTMLElement>(): (
  element: Element | null,
) => void {
  const current = useRef<Element | null>(null);

  useLayoutEffect(() => {
    // A change of the page's size is measured in the next frame, outside the
    // observer's own turn, so that the observer never loops.
    let frame = 0;
    const measureNext = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (current.current !== null) centre(current.current);
      });
    };

    window.addEventListener('resize', measureNext);
    const page = new ResizeObserver(measureNext);
    page.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measureNext);
      page.disconnect();
    };
  }, []);

  return useCallback((element: Element | null) => {
    current.current = element;
    if (element !== null) centre(element);
  }, []);
}

// Sets the element's height and the padding at its foot. Neither where the
// element starts nor what is kept below it depends on its own height, so a
// measure sets the same values again and changes nothing, and a size it
// changes is not changed back.
function centre(element: HTMLElement): void {
  const top = element.getBoundingClientRect().top + window.scrollY;
  const below = keptBelow(element);
  const paddingTop = parseFloat(getComputedStyle(element).paddingBlockStart) || 0;
  const minHeight = `${Math.max(0, Math.floor(window.innerHeight - top - below))}px`;
  const paddingEnd = `${Math.max(paddingTop, top - below + paddingTop)}px`;
  if (element.style.minHeight !== minHeight) element.style.minHeight = minHeight;
  if (element.style.paddingBlockEnd !== paddingEnd)
    element.style.paddingBlockEnd = paddingEnd;
}

// What the page keeps below an element, down to the foot of the document:
// each ancestor's padding and border at its foot, the margins at the foot of
// each element on the way, and whatever follows each of them.
function keptBelow(element: HTMLElement): number {
  let below = 0;
  for (let node: HTMLElement | null = element; node !== null; node = node.parentElement) {
    const style = getComputedStyle(node);
    below += parseFloat(style.marginBlockEnd) || 0;
    if (node !== element) {
      below +=
        (parseFloat(style.paddingBlockEnd) || 0) +
        (parseFloat(style.borderBlockEndWidth) || 0);
    }
    for (
      let next = node.nextElementSibling;
      next !== null;
      next = next.nextElementSibling
    ) {
      if (next instanceof HTMLElement && inTheFlow(next)) below += next.offsetHeight;
    }
    if (node === document.body) break;
  }
  return below;
}

// Whether an element takes room in the page's flow, unlike one that floats
// over it, such as a dialog's layer.
function inTheFlow(element: HTMLElement): boolean {
  const { position } = getComputedStyle(element);
  return position !== 'absolute' && position !== 'fixed';
}
