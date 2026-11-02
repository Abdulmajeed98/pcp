// The Motion section's tokens for what the dashboard moves from script, with
// the Web Animations API or a scroll, where a CSS transition cannot do it:
// the curves are read from the theme itself (`@pcp/ui`'s dashboard.css), so
// that they are written once, and the durations are the Motion section's for
// something that changes its place or its size.

// Whether the person asked for reduced motion (DESIGN.md's Reduced motion).
export function motionIsReduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// One of the theme's curves, as the theme defines it.
function curve(name: 'ease-out' | 'ease-in-out'): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

// How something that changes its place or its size moves: 200 ms on the
// curve it takes at full motion, or 150 ms on the out curve with reduced
// motion, which shortens it but never makes it a jump.
export function aMovement(fullCurve: 'ease-out' | 'ease-in-out'): {
  duration: number;
  easing: string;
} {
  return motionIsReduced()
    ? { duration: 150, easing: curve('ease-out') }
    : { duration: 200, easing: curve(fullCurve) };
}

// How something fades where it is, as the Motion section's fades run, with
// reduced motion as without, since a fade tells what happened and moves
// nothing: an arrival in 200 ms and an exit, faster, in 150, both on the out
// curve (the Exit Is Faster Rule).
export function aFade(way: 'in' | 'out'): { duration: number; easing: string } {
  return { duration: way === 'in' ? 200 : 150, easing: curve('ease-out') };
}

// How a scroll that keeps something in sight runs: smooth at full motion,
// at once with reduced motion, which drops a movement of the whole screen.
export function aScroll(): ScrollBehavior {
  return motionIsReduced() ? 'instant' : 'smooth';
}
