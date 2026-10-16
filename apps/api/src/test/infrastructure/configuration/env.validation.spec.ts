import { aPortWhereNothingListens } from '../../test-utils/network';

describe("the API's settings", () => {
  const settingNames = [
    'PORT',
    'CORS_ALLOWED_ORIGINS',
    'KEYCLOAK_ISSUER',
    'KEYCLOAK_AUDIENCE',
    'DATASOURCE_URL',
    'DATASOURCE_USERNAME',
    'DATASOURCE_PASSWORD',
    'OPENDB_REPOSITORY_URL',
    'KEYCLOAK_URL',
    'KEYCLOAK_REALM',
    'KEYCLOAK_CLIENT_ID',
    'KEYCLOAK_CLIENT_SECRET',
  ];
  const environmentBefore = new Map(settingNames.map((name) => [name, process.env[name]]));

  // The database password and the client's secret have no default, so each
  // case starts with both, and the case about either takes it away.
  beforeEach(() => {
    for (const name of settingNames) delete process.env[name];
    process.env.DATASOURCE_PASSWORD = 'a-password';
    process.env.KEYCLOAK_CLIENT_SECRET = 'a-secret';
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

  it("have the development values as their defaults, apart from the database password and the client's secret", async () => {
    const { validate } = await import('~/infrastructure/configuration/env.validation');

    const settings = validate({
      DATASOURCE_PASSWORD: 'a-password',
      KEYCLOAK_CLIENT_SECRET: 'a-secret',
    });

    expect(settings.PORT).toBe(3001);
    expect([...settings.CORS_ALLOWED_ORIGINS]).toEqual(['http://localhost:3002']);
    expect(settings.KEYCLOAK_ISSUER).toBe('http://localhost:8080/realms/pcp');
    expect(settings.KEYCLOAK_AUDIENCE).toBe('pcp-api');
    expect(settings.DATASOURCE_URL).toBe('postgresql://localhost:5432/pcp');
    expect(settings.DATASOURCE_USERNAME).toBe('pcp');
    expect(settings.OPENDB_REPOSITORY_URL).toBe(
      'https://github.com/buildcores/buildcores-open-db',
    );
    expect(settings.KEYCLOAK_URL).toBe('http://localhost:8080');
    expect(settings.KEYCLOAK_REALM).toBe('pcp');
    expect(settings.KEYCLOAK_CLIENT_ID).toBe('pcp-api');
  });

  it("let the application start when only the database password and the client's secret are set", async () => {
    await expect(startTheApplication()).resolves.toBeUndefined();
  });

  it('stop the application when the database password is not set, and name the setting', async () => {
    delete process.env.DATASOURCE_PASSWORD;

    await expect(startTheApplication()).rejects.toThrow(/DATASOURCE_PASSWORD/);
  });

  it("stop the application when the API's client's secret is not set, and name the setting", async () => {
    delete process.env.KEYCLOAK_CLIENT_SECRET;

    await expect(startTheApplication()).rejects.toThrow(/KEYCLOAK_CLIENT_SECRET/);
  });

  it("stop the application when Keycloak's address is malformed, and name the setting", async () => {
    process.env.KEYCLOAK_URL = 'localhost:8080';

    await expect(startTheApplication()).rejects.toThrow(/KEYCLOAK_URL/);
  });

  it('stop the application when the realm is empty, and name the setting', async () => {
    process.env.KEYCLOAK_REALM = '';

    await expect(startTheApplication()).rejects.toThrow(/KEYCLOAK_REALM/);
  });

  it("stop the application when the API's client is empty, and name the setting", async () => {
    process.env.KEYCLOAK_CLIENT_ID = '';

    await expect(startTheApplication()).rejects.toThrow(/KEYCLOAK_CLIENT_ID/);
  });

  it("let the application start while Keycloak's administration interface cannot be reached", async () => {
    process.env.KEYCLOAK_URL = `http://127.0.0.1:${await aPortWhereNothingListens()}`;

    await expect(startTheApplication()).resolves.toBeUndefined();
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

  it("stop the application when OpenDB's repository is reached over plain HTTP on another machine, and name the setting", async () => {
    process.env.OPENDB_REPOSITORY_URL = 'http://github.com/buildcores/buildcores-open-db';

    await expect(startTheApplication()).rejects.toThrow(/OPENDB_REPOSITORY_URL/);
  });

  it('stop the application when the audience is empty, and name the setting', async () => {
    process.env.KEYCLOAK_AUDIENCE = '';

    await expect(startTheApplication()).rejects.toThrow(/KEYCLOAK_AUDIENCE/);
  });
});
