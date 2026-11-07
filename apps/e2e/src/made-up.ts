// Values the tests make up for the test data they leave in the development
// services. `Math.random` is their one source of randomness.

// Random digits, as many as asked for.
export function randomDigits(count: number): string {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 10)).join('');
}

// The millisecond of the last word this process made.
let lastWordsMillisecond = 0;

// A word of digits that no earlier run made: a millisecond, and three random
// digits for two processes that make a word in the same one. A word made in
// the millisecond of the process's last word, or before it, takes the next
// one, so the process never makes the same word twice.
export function aWordUniqueToTheRun(): string {
  lastWordsMillisecond = Math.max(Date.now(), lastWordsMillisecond + 1);
  return `${lastWordsMillisecond}${randomDigits(3)}`;
}
