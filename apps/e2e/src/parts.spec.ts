import { expect, test } from '@playwright/test';

import { authorizationOfTheDevelopmentAdmin } from './development-logins';
import { apiUrl } from './platform';

test("the API stores a Part: the development Admin creates a made-up Part, and the platform's database gives it back", async ({
  page,
  request,
}) => {
  const authorization = await authorizationOfTheDevelopmentAdmin(page);
  // Unique to the run, and plainly test data. It stays in the development
  // database, which `pnpm services:reset` empties.
  const run = Date.now();
  const part = {
    category: 'cpu',
    name: `Made-up test Part ${run}`,
    manufacturer: 'Made-up Test Parts',
    partNumbers: [`TEST-${run}`],
  };

  const created = await request.post(`${apiUrl}/v1/parts`, {
    headers: { authorization },
    data: part,
  });
  expect(created.status()).toBe(201);
  const stored = (await created.json()) as { id: string };

  const read = await request.get(`${apiUrl}/v1/parts/${stored.id}`, {
    headers: { authorization },
  });
  expect(read.status()).toBe(200);
  expect(await read.json()).toEqual({
    id: stored.id,
    openDbId: null,
    ...part,
    specifications: {},
    missingNeededSpecifications: [
      'socket',
      'specifications.tdp',
      'specifications.memory.types',
    ],
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    photoPath: null,
  });
});
