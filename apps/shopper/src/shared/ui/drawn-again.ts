// The mark of a page drawn again, in place or at an anchor, on its document
// (DESIGN.md's When a movement plays): the theme then shows every piece of
// it as it is, printed, and nothing prints a second time or settles again.
// The theme reads it as `:root[data-drawn-again]`. Three pieces mark a page
// so, each when its own page is drawn again, all through `markDrawnAgain`:
// `MarkAReturnOrAnAnchor`, before the first paint of a page opened at an
// anchor; `MarkADrawingAgain`, when a list's query changes in place; and the
// Build page's changes in place (`ChangesInPlace`). The mark stays until the
// page is left.
export const drawnAgain = 'data-drawn-again';

export function markDrawnAgain(): void {
  document.documentElement.setAttribute(drawnAgain, '');
}
