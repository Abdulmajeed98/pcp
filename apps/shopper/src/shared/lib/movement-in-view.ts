// Whether a movement of a piece below the first screen may play, as the
// page's script runs (DESIGN.md's When a movement plays): never on a page
// come back to by back or forward, which the document marks before it draws
// (`data-returned`), nor under reduced motion. Asked in the browser alone.
export function aMovementMayPlay(): boolean {
  return (
    !document.documentElement.hasAttribute('data-returned') &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// Watches an element until its top comes about nine tenths of the way down
// the window, the moment a piece below the first screen plays its movement,
// and then calls `reached`, once. Gives back what stops the watching, for the
// effect that started it to clean up with.
export function whenInView(element: Element, reached: () => void): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      reached();
      observer.disconnect();
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  observer.observe(element);
  return () => observer.disconnect();
}
