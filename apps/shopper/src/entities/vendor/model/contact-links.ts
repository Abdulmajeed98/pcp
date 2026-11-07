import type { VisibleVendorResponse } from '@pcp/api-client';
import {
  googleMapsSearchFor,
  instagramHandleOf,
  instagramProfileOf,
  whatsAppChatWith,
} from '@pcp/links';

// What a link of a Vendor's contact details does: call the shop, open a chat
// with it on WhatsApp, open its Instagram profile, or open its location in
// Google Maps.
export type ContactKind = 'call' | 'whatsApp' | 'instagram' | 'map';

// One link of a Vendor's contact details: what it does, the address it
// opens, and the detail it shows as a person reads it, a number in Iraq's
// own form or an Instagram name with its "@"; the map's shows none.
export interface ContactLink {
  kind: ContactKind;
  address: string;
  detail: string | null;
}

// The address that calls a phone number, from its international form, which
// the API answers with no spaces (RFC 3966): `tel:+9647501234567`.
function callAddress(internationalNumber: string): string {
  return `tel:${internationalNumber}`;
}

// The links a Vendor page makes of a Vendor's contact details (DESIGN.md's A
// Vendor's contact details and their links, BRW-4), in the coupon's order:
// its phone number calls the shop; its WhatsApp number opens WhatsApp's chat
// with it; its Instagram name opens its profile; its map location opens
// Google Maps' search for its coordinates, as `@pcp/links` writes each
// address both frontends link out to. A detail the Vendor has not given has
// no link, and every Vendor has a phone number.
export function contactLinksOf(
  vendor: Pick<
    VisibleVendorResponse,
    'phoneNumber' | 'whatsAppNumber' | 'instagramName' | 'mapLocation'
  >,
): ContactLink[] {
  const { phoneNumber, whatsAppNumber, instagramName, mapLocation } = vendor;
  return [
    {
      kind: 'call',
      address: callAddress(phoneNumber.international),
      detail: phoneNumber.national,
    },
    ...(whatsAppNumber === null
      ? []
      : [
          {
            kind: 'whatsApp' as const,
            address: whatsAppChatWith(whatsAppNumber.international),
            detail: whatsAppNumber.national,
          },
        ]),
    ...(instagramName === null
      ? []
      : [
          {
            kind: 'instagram' as const,
            address: instagramProfileOf(instagramName),
            detail: instagramHandleOf(instagramName),
          },
        ]),
    ...(mapLocation === null
      ? []
      : [
          { kind: 'map' as const, address: googleMapsSearchFor(mapLocation), detail: null },
        ]),
  ];
}
