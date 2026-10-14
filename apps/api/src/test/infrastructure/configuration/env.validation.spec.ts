describe("the API's settings", () => {
  const settingNames = [
    'PORT',
    'CORS_ALLOWED_ORIGINS',
    'KEYCLOAK_ISSUER',
    'KEYCLOAK_AUDIENCE',
    'DATASOURCE_URL',
    'DATASOURCE_USERNAME',
    'DATASOURCE_PASSWORD',
  ];
  const environmentBefore = new Map(settingNames.map((name) => [name, process.env[name]]));

  // The database password has no default, so each case starts with one and
  // the case about the password takes it away.
  beforeEach(() => {
    for (const name of settingNames) delete process.env[name];
    process.env.DATASOURCE_PASSWORD = 'a-password';
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

  it('have the development values as their defaults, apart from the database password', async () => {
    const { validate } = await import('~/infrastructure/configuration/env.validation');

    const settings = validate({ DATASOURCE_PASSWORD: 'a-password' });

    expect(settings.PORT).toBe(3001);
    expect([...settings.CORS_ALLOWED_ORIGINS]).toEqual(['http://localhost:3002']);
    expect(settings.KEYCLOAK_ISSUER).toBe('http://localhost:8080/realms/pcp');
    expect(settings.KEYCLOAK_AUDIENCE).toBe('pcp-api');
    expect(settings.DATASOURCE_URL).toBe('postgresql://localhost:5432/pcp');
    expect(settings.DATASOURCE_USERNAME).toBe('pcp');
  });

  it('let the application start when only the database password is set', async () => {
    await expect(startTheApplication()).resolves.toBeUndefined();
  });

  it('stop the application when the database password is not set, and name the setting', async () => {
    delete process.env.DATASOURCE_PASSWORD;

    await expect(startTheApplication()).rejects.toThrow(/DATASOURCE_PASSWORD/);
  });

  it("stop the application when the database's address is malformed, and name the setting", async () => {
    process.env.DATASOURCE_URL = 'localhost:5432/pcp';

    await expect(startTheApplication()).rejects.toThrow(/DATASOURCE_URL/);
  });

  it('stop the application when the database user is empty, and name the setting', async () => {
    process.env.DATASOURCE_USERNAME = '';

    await expect(startTheApplication()).rejects.toThrow(/DATASOURCE_USERNAME/);
  });

  it('stop the application when the port is malformed, and name the setting', async () => {
    process.env.PORT = 'seventy';

    await expect(startTheApplication()).rejects.toThrow(/PORT/);
  });

  it('stop the application when an accepted origin is malformed, and name the setting', async () => {
    process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3002/';

    await expect(startTheApplication()).rejects.toThrow(/CORS_ALLOWED_ORIGINS/);
  });

  it("stop the application when the realm's issuer is malformed, and name the setting", async () => {
    process.env.KEYCLOAK_ISSUER = 'localhost:8080/realms/pcp';

    await expect(startTheApplication()).rejects.toThrow(/KEYCLOAK_ISSUER/);
  });

  it('stop the application when the audience is empty, and name the setting', async () => {
    process.env.KEYCLOAK_AUDIENCE = '';

    await expect(startTheApplication()).rejects.toThrow(/KEYCLOAK_AUDIENCE/);
  });
});
