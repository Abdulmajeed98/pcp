import { expect, test } from '@playwright/test';

import { apiUrl, shopperUrl } from './platform';

test("the Shopper app's page comes from the API: it shows the time the API says it started", async ({
  page,
  request,
}) => {
  const status = await request.get(`${apiUrl}/v1/status`);
  expect(status.status()).toBe(200);
  const { startedAt } = (await status.json()) as { startedAt: string };

  // The page as the server sends it, before any script has run.
  const served = await request.get(shopperUrl);
  expect(await served.text()).toContain(startedAt);

  await page.goto(shopperUrl);
  await expect(page.getByText(startedAt)).toBeVisible();
});
