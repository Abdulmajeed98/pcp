// The API's clock, which gives the time of every Confirmation, moved by a test
// to a moment of its choosing and held there. Only `Date` is faked: every
// timer and every other clock that `pg`, NestJS and `fetch` need stays real.
//
// A token is judged by the same clock, so a test makes its tokens after it
// moves the clock.
export function moveTheClockTo(moment: Date): void {
  jest.useFakeTimers({
    now: moment,
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
}

// The real clock again.
export function letTheClockRun(): void {
  jest.useRealTimers();
}
