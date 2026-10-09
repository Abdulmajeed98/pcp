import { createTestApp, TestApp } from '../../../test-utils/create-test-app';

describe('the status endpoint', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('answers the time this API process started', async () => {
    const before = Date.now();

    const response = await fetch(`${testApp.baseUrl}/v1/status`);

    expect(response.status).toBe(200);
    const { startedAt } = (await response.json()) as { startedAt: string };
    expect(new Date(startedAt).toISOString()).toBe(startedAt);
    expect(new Date(startedAt).getTime()).toBeLessThanOrEqual(before);
  });

  it('answers the same time until the API is restarted', async () => {
    const first = await (await fetch(`${testApp.baseUrl}/v1/status`)).json();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = await (await fetch(`${testApp.baseUrl}/v1/status`)).json();

    expect(second).toEqual(first);
  });
});
