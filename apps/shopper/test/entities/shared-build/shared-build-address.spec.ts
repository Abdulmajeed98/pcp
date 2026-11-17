import { describe, expect, it } from 'vitest';

import { sharedBuildAddress, sharedBuildLink } from '@/entities/shared-build';

const sharedBuildId = '3f6c1e9a-8b2d-4f71-9c5e-a04d7b2e91c3';

// The Shared Build page's address (the sharing spec's The Shopper app), in
// the language of the Shopper who shared it, and the link the Shopper sends,
// that address on the Shopper app's public address (ADR-0008, ADR-0014).
describe("the Shared Build page's address", () => {
  it('is under its language, the Shared Build named by its identifier', () => {
    expect(sharedBuildAddress('ckb', sharedBuildId)).toBe(`/ckb/builds/${sharedBuildId}`);
    expect(sharedBuildAddress('ar', sharedBuildId)).toBe(`/ar/builds/${sharedBuildId}`);
    expect(sharedBuildAddress('en', sharedBuildId)).toBe(`/en/builds/${sharedBuildId}`);
  });
});

describe("a Shared Build's link", () => {
  it("is its page's address in the sender's language, on the public address", () => {
    expect(sharedBuildLink('https://pcparts.example', 'ckb', sharedBuildId)).toBe(
      `https://pcparts.example/ckb/builds/${sharedBuildId}`,
    );
    expect(sharedBuildLink('http://localhost:3000', 'ar', sharedBuildId)).toBe(
      `http://localhost:3000/ar/builds/${sharedBuildId}`,
    );
    expect(sharedBuildLink('http://localhost:3000', 'en', sharedBuildId)).toBe(
      `http://localhost:3000/en/builds/${sharedBuildId}`,
    );
  });
});
