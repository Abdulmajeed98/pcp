import { describe, expect, it } from 'vitest';

import {
  addressAfterARefusedSend,
  refusedSendIn,
  type SendRefusal,
} from '@/features/send-on-whatsapp';

const vendor = '00000000-0000-4000-8000-000000000003';
const sharedBuild = '3f6c1e9a-8b2d-4f71-9c5e-a04d7b2e91c3';
const kit = '00000000-0000-4000-8000-0000000c0005';

// "Send on WhatsApp" is a plain form that opens a new tab; a send refused
// answers that tab with the page the form was sent from, opened at the
// Vendor's line, its reason and its Vendor in the address, so that the page
// says it under that line, with script or without, and no chat is opened
// (the sharing spec's The Shopper app, DESIGN.md's Send on WhatsApp): a
// Vendor no longer reachable through the platform, deactivated or without a
// WhatsApp number since the page was drawn, and an API that does not answer.
describe('the address a refused send answers with', () => {
  it.each<[SendRefusal, string]>([
    ['notReachable', `/en/build?refused=notReachable&vendor=${vendor}#vendor-${vendor}`],
    ['notOpened', `/en/build?refused=notOpened&vendor=${vendor}#vendor-${vendor}`],
  ])('is the Build page at the Vendor’s line, saying why: %s', (refused, address) => {
    expect(addressAfterARefusedSend('/en/build', refused, vendor)).toBe(address);
    expect(refusedSendIn(new URL(address, 'http://shop.example').searchParams)).toEqual({
      refused,
      vendor,
    });
  });

  it('is the Shared Build page the form was sent from, in its language', () => {
    expect(
      addressAfterARefusedSend(`/ckb/builds/${sharedBuild}`, 'notReachable', vendor),
    ).toBe(
      `/ckb/builds/${sharedBuild}?refused=notReachable&vendor=${vendor}#vendor-${vendor}`,
    );
    expect(addressAfterARefusedSend(`/ar/builds/${sharedBuild}`, 'notOpened', vendor)).toBe(
      `/ar/builds/${sharedBuild}?refused=notOpened&vendor=${vendor}#vendor-${vendor}`,
    );
  });

  it('names the Vendor as the API names it, in small letters', () => {
    expect(
      addressAfterARefusedSend('/en/build', 'notReachable', vendor.toUpperCase()),
    ).toBe(`/en/build?refused=notReachable&vendor=${vendor}#vendor-${vendor}`);
  });

  it('names no Vendor, and opens at the Vendors, for a Vendor that is no identifier', () => {
    for (const sent of [undefined, '', 'not-a-vendor', `${vendor}#top`, `${vendor}x`]) {
      expect(addressAfterARefusedSend('/en/build', 'notReachable', sent)).toBe(
        '/en/build?refused=notReachable#vendors',
      );
    }
  });
});

// The page reads nothing it does not know, so that an address changed by
// hand, or one a share, a copy or a change to the Build was refused with,
// says nothing of a send.
describe('why a send was refused, as a page reads it', () => {
  it.each([
    '',
    'refused=',
    `refused=notreachable&vendor=${vendor}`,
    `refused=noWhatsAppNumber&vendor=${vendor}`,
    'refused=notShared',
    'refused=nothingToShare',
    'refused=notCopied',
    'refused=mostKitsOrDrives&category=ram',
    `refused=mostOfOne&category=ram&part=${kit}`,
    `sent=notOpened&vendor=${vendor}`,
  ])('reads %j as no send refused', (query) => {
    expect(refusedSendIn(new URLSearchParams(query))).toBeUndefined();
  });

  it('reads a refusal with no Vendor, or with one that is no identifier, as naming none', () => {
    expect(refusedSendIn(new URLSearchParams('refused=notReachable'))).toEqual({
      refused: 'notReachable',
      vendor: undefined,
    });
    expect(
      refusedSendIn(new URLSearchParams('refused=notOpened&vendor=<b>Shop</b>')),
    ).toEqual({ refused: 'notOpened', vendor: undefined });
  });

  it('reads the first reason and the first Vendor when the address repeats them', () => {
    expect(
      refusedSendIn(
        new URLSearchParams(
          `refused=notOpened&refused=notReachable&vendor=${vendor}&vendor=${kit}`,
        ),
      ),
    ).toEqual({ refused: 'notOpened', vendor });
  });

  it('reads a Vendor in capitals in small letters', () => {
    expect(
      refusedSendIn(
        new URLSearchParams(`refused=notOpened&vendor=${vendor.toUpperCase()}`),
      ),
    ).toEqual({ refused: 'notOpened', vendor });
  });
});
