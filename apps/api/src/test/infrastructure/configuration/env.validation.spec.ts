describe("the API's settings", () => {
  const settingNames = ['PORT', 'CORS_ALLOWED_ORIGINS'];
  const environmentBefore = new Map(settingNames.map((name) => [name, process.env[name]]));

  beforeEach(() => {
    for (const name of settingNames) delete process.env[name];
  });

  afterAll(() => {
    for (const [name, value] of environmentBefore) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  // Starts the application the way every test does, and stops it again. The
  // settings are read when the root module is loaded, so each case loads
  // everything afresh.
  function startTheApplication(): Promise<void> {
    return jest.isolateModulesAsync(async () => {
      const { createTestApp } = await import('../../test-utils/create-test-app');
      const { app } = await createTestApp();
      await app.close();
    });
  }

  it('have the development values as their defaults', async () => {
    const { validate } = await import('~/infrastructure/configuration/env.validation');

    const settings = validate({});

    expect(settings.PORT).toBe(3001);
    expect([...settings.CORS_ALLOWED_ORIGINS]).toEqual(['http://localhost:3002']);
  });

  it('let the application start when none is set', async () => {
    await expect(startTheApplication()).resolves.toBeUndefined();
  });

  it('stop the application when the port is malformed, and name the setting', async () => {
    process.env.PORT = 'seventy';

    await expect(startTheApplication()).rejects.toThrow(/PORT/);
  });

  it('stop the application when an accepted origin is malformed, and name the setting', async () => {
    process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3002/';

    await expect(startTheApplication()).rejects.toThrow(/CORS_ALLOWED_ORIGINS/);
  });
});
