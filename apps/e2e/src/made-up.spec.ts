import { expect, test } from '@playwright/test';

import { aWordUniqueToTheRun } from './made-up';

// A test that makes two words in one statement, as a new password and a
// confirmation that must not match it, makes them in the same millisecond and
// needs them to differ. So do a thousand made in a row.
test('a thousand words unique to the run, made in a row, are a thousand different words', () => {
  const words = Array.from({ length: 1000 }, () => aWordUniqueToTheRun());

  expect(new Set(words).size).toBe(words.length);
});
