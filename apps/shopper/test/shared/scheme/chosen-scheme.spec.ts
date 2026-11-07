import { describe, expect, it } from 'vitest';

import { schemeAfter, schemeIn } from '@/shared/scheme';

// The cookies of a request, holding the scheme cookie's value, or none.
function cookiesWith(value?: string) {
  return {
    get: (name: string) =>
      name === 'scheme' && value !== undefined ? { value } : undefined,
  };
}

describe('the scheme a request asks for', () => {
  it.each(['light', 'dark'] as const)('is the one its cookie holds, %s', (scheme) => {
    expect(schemeIn(cookiesWith(scheme))).toBe(scheme);
  });

  // The device's is never written down: it is the first choice, and what
  // the page shows when nothing else is chosen.
  it.each([
    ['no cookie', undefined],
    ['the device', 'device'],
    ['anything else', 'sepia'],
  ])("is the device's when the cookie holds %s", (_, value) => {
    expect(schemeIn(cookiesWith(value))).toBe('device');
  });
});

describe("the phone's one button for the scheme", () => {
  it('turns through light, dark and the device, and back to light', () => {
    expect(schemeAfter('light')).toBe('dark');
    expect(schemeAfter('dark')).toBe('device');
    expect(schemeAfter('device')).toBe('light');
  });
});
