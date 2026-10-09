import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

import { validateEnvironment } from '../../../infrastructure/configuration/env.validation';
import { parseAllowedOrigins } from '../../../infrastructure/security/cors';
import { IsOrigin } from '../../../infrastructure/security/IsOrigin';

// A settings class of the kind an application writes.
class Settings {
  @IsInt()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => Number(value))
  PORT = 3001;

  @IsOrigin({ each: true })
  @Transform(({ value }) => parseAllowedOrigins(value))
  ORIGINS = new Set(['http://localhost:3002']);
}

describe('the settings check', () => {
  it('gives each setting its default when the environment does not set it', () => {
    const settings = validateEnvironment(Settings, {});

    expect(settings.PORT).toBe(3001);
    expect([...settings.ORIGINS]).toEqual(['http://localhost:3002']);
  });

  it('reads a setting from the environment, in the type its class gives it', () => {
    const settings = validateEnvironment(Settings, {
      PORT: '4000',
      ORIGINS: 'https://one.test, https://two.test',
    });

    expect(settings.PORT).toBe(4000);
    expect([...settings.ORIGINS]).toEqual(['https://one.test', 'https://two.test']);
  });

  it('refuses a malformed setting and names it', () => {
    expect(() => validateEnvironment(Settings, { PORT: 'seventy' })).toThrow(/PORT/);
  });

  it('refuses a setting that is out of range and names it', () => {
    expect(() => validateEnvironment(Settings, { PORT: '70000' })).toThrow(/PORT/);
  });

  it('refuses a list with a malformed entry and names the setting', () => {
    expect(() =>
      validateEnvironment(Settings, { ORIGINS: 'https://one.test,http://localhost:3002/' }),
    ).toThrow(/ORIGINS/);
  });

  it('names every malformed setting at once', () => {
    expect(() =>
      validateEnvironment(Settings, { PORT: 'seventy', ORIGINS: 'nowhere' }),
    ).toThrow(/PORT.*ORIGINS/s);
  });

  it('is not troubled by the rest of the environment', () => {
    const settings = validateEnvironment(Settings, {
      PATH: '/usr/bin',
      HOME: '/home/someone',
    });

    expect(settings.PORT).toBe(3001);
  });
});
