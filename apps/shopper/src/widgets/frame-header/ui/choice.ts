// How each choice of the frame's three switches is drawn (DESIGN.md's The
// switches): in the Small type, at least 44 by 44 pixels on a touchscreen and
// 36 under a mouse from 64rem, plain until chosen; the chosen one in the Ink
// at weight 700 with a 2-pixel underline 6 pixels below, which `data-chosen`
// marks beside the choice's own `aria-current`, so that its state is in a
// mark as well as its weight. A pointer over another choice underlines it at
// 1 pixel. A press settles it (Motion 8), and its words are not selected
// under a resting thumb.
export const choice =
  'pressable inline-flex min-h-control min-w-control cursor-pointer items-center justify-center px-1.5 text-sm whitespace-nowrap text-foreground decoration-1 underline-offset-[6px] md:px-2.5 hover:underline data-chosen:font-bold data-chosen:underline data-chosen:decoration-2';
