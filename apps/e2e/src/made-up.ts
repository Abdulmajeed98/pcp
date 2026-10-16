// Values the tests make up for the test data they leave in the development
// services. `Math.random` is their one source of randomness.

// Random digits, as many as asked for.
export function randomDigits(count: number): string {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 10)).join('');
}

// A word of digits that no earlier run made: the time in milliseconds, and
// three random digits for two words made in the same millisecond.
export function aWordUniqueToTheRun(): string {
  return `${Date.now()}${randomDigits(3)}`;
}
