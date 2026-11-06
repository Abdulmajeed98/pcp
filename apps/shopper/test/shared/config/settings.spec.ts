import { describe, expect, it } from 'vitest';

import { MalformedSetting, settingsOf } from '@/shared/config';

// The Shopper app's settings, read from its environment when its server
// starts and whenever a request reads one.
describe("the Shopper app's settings", () => {
  it('are the development addresses when nothing is set', () => {
    expect(settingsOf({})).toEqual({
      apiUrl: 'http://localhost:3001',
      publicAddress: 'http://localhost:3000',
    });
  });

  // An environment file can name a setting and give it nothing, as
  // `.env.example` lists them.
  it('are the development addresses when a setting is set to nothing', () => {
    expect(settingsOf({ API_URL: '', SHOPPER_PUBLIC_URL: ' ' })).toEqual({
      apiUrl: 'http://localhost:3001',
      publicAddress: 'http://localhost:3000',
    });
  });

  it('take the addresses that are set', () => {
    expect(
      settingsOf({
        API_URL: 'http://api.internal:8080',
        SHOPPER_PUBLIC_URL: 'https://parts.example',
      }),
    ).toEqual({
      apiUrl: 'http://api.internal:8080',
      publicAddress: 'https://parts.example',
    });
  });

  // Every address of a page is written from the origin, so a slash at its
  // end is not written twice.
  it('take the public address as its origin, with no slash at its end', () => {
    expect(settingsOf({ SHOPPER_PUBLIC_URL: 'https://parts.example/' }).publicAddress).toBe(
      'https://parts.example',
    );
  });

  it.each([
    ['not an address', 'parts.example'],
    ['an address of another kind', 'ftp://parts.example'],
    ['an address with a path', 'https://parts.example/shop'],
    ['an address with a query', 'https://parts.example/?from=whatsapp'],
  ])('refuse a public address that is %s, naming the setting', (_, value) => {
    expect(() => settingsOf({ SHOPPER_PUBLIC_URL: value })).toThrow(MalformedSetting);
    expect(() => settingsOf({ SHOPPER_PUBLIC_URL: value })).toThrow(/^SHOPPER_PUBLIC_URL /);
  });

  it.each([
    ['not an address', 'localhost:3001'],
    ['an address of another kind', 'postgresql://localhost:5432/pcp'],
  ])("refuse an API's address that is %s, naming the setting", (_, value) => {
    expect(() => settingsOf({ API_URL: value })).toThrow(MalformedSetting);
    expect(() => settingsOf({ API_URL: value })).toThrow(/^API_URL /);
  });
});
