import {
  isOrigin,
  isOriginAllowed,
  parseAllowedOrigins,
} from '../../../infrastructure/security/cors';

describe('the allowed-origins rule', () => {
  describe('reading the setting', () => {
    it('reads origins separated by commas, without the spaces around them', () => {
      const origins = parseAllowedOrigins(' http://localhost:3002 ,https://example.test');

      expect([...origins]).toEqual(['http://localhost:3002', 'https://example.test']);
    });

    it('reads an empty setting as no origin at all', () => {
      expect(parseAllowedOrigins('').size).toBe(0);
    });
  });

  describe('telling an origin from something else', () => {
    it.each(['http://localhost:3002', 'https://example.test'])(
      'takes %s as an origin',
      (value) => {
        expect(isOrigin(value)).toBe(true);
      },
    );

    it.each([
      ['an address with a path', 'http://localhost:3002/'],
      ['an address with no scheme', 'localhost:3002'],
      ['a scheme a browser does not call from', 'ftp://example.test'],
      ['a word', 'everywhere'],
      ['a number', 3002],
    ])('does not take %s as an origin', (_what, value) => {
      expect(isOrigin(value)).toBe(false);
    });
  });

  describe('judging a request', () => {
    const allowed = new Set(['http://localhost:3002']);

    it('allows an origin that is on the list', () => {
      expect(isOriginAllowed('http://localhost:3002', allowed)).toBe(true);
    });

    it('refuses an origin that is not on the list', () => {
      expect(isOriginAllowed('http://localhost:4000', allowed)).toBe(false);
    });

    it('refuses the same host on another scheme', () => {
      expect(isOriginAllowed('https://localhost:3002', allowed)).toBe(false);
    });

    it('allows a request that names no origin, which is not a browser call', () => {
      expect(isOriginAllowed(undefined, allowed)).toBe(true);
    });
  });
});
