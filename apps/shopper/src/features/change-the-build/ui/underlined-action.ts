// An action on the Build's sheet that reads as words (DESIGN.md's A Category
// on the Build's sheet): Change, Remove and Add another, underlined words 44
// pixels tall and at least as wide to the touch, a short Kurdish word among
// them, as Clear all is on a Category page, the underline
// 2 pixels under a hovering pointer. A button among them settles when
// pressed (Motion 8), and none shows a long-press menu or selects its words
// under a resting thumb; a link keeps the phone's own menu.
export const underlinedAction =
  'hover-underline inline-flex min-h-control min-w-control cursor-pointer items-center text-base';

export const underlinedButton = `${underlinedAction} pressable no-callout`;
