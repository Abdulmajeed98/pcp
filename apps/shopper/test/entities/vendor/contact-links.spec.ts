import type { VisibleVendorResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { contactLinksOf } from '@/entities/vendor';

// A made-up Vendor with every contact detail, as the API answers it: its
// numbers in the stored, international form for links and in Iraq's own
// form for people, its Instagram name bare and in lower case.
const everyDetail: VisibleVendorResponse = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'کۆگای پارچەی خەیاڵی',
  city: 'erbil',
  address: 'شەقامی نموونە، ژمارە 2\nبازاڕی خەیاڵی، هەولێر',
  mapLocation: { latitude: 36.1932, longitude: 44.0109 },
  phoneNumber: { international: '+9647501000002', national: '0750 100 0002' },
  whatsAppNumber: { international: '+9647511000002', national: '0751 100 0002' },
  instagramName: 'fictional.parts.store',
  openingHours: 'شەممە تا پێنجشەممە، 9:30 تا 21:00\nهەینی داخراوە',
};

// The links a Vendor page makes of a Vendor's contact details (DESIGN.md's A
// Vendor's contact details and their links, BRW-4): its phone number calls
// the shop, its WhatsApp number opens a chat with it, its Instagram name
// opens its profile, and its map location opens Google Maps' search for its
// coordinates. Each detail is shown as a person reads it. A detail the
// Vendor has not given has no link.
describe("a Vendor's contact links", () => {
  it('calls, chats, opens the profile and opens the map, in that order, each at its address', () => {
    expect(contactLinksOf(everyDetail)).toEqual([
      { kind: 'call', address: 'tel:+9647501000002', detail: '0750 100 0002' },
      {
        kind: 'whatsApp',
        address: 'https://wa.me/9647511000002',
        detail: '0751 100 0002',
      },
      {
        kind: 'instagram',
        address: 'https://www.instagram.com/fictional.parts.store/',
        detail: '@fictional.parts.store',
      },
      {
        kind: 'map',
        address: 'https://www.google.com/maps/search/?api=1&query=36.1932%2C44.0109',
        detail: null,
      },
    ]);
  });

  it('has the call alone for a Vendor that gave its phone number alone, an Erbil landline', () => {
    expect(
      contactLinksOf({
        phoneNumber: { international: '+964662234567', national: '066 223 4567' },
        whatsAppNumber: null,
        instagramName: null,
        mapLocation: null,
      }),
    ).toEqual([{ kind: 'call', address: 'tel:+964662234567', detail: '066 223 4567' }]);
  });

  it('leaves out each detail the Vendor has not given, and keeps the order of the rest', () => {
    expect(
      contactLinksOf({ ...everyDetail, whatsAppNumber: null, mapLocation: null }).map(
        ({ kind }) => kind,
      ),
    ).toEqual(['call', 'instagram']);
    expect(
      contactLinksOf({ ...everyDetail, instagramName: null }).map(({ kind }) => kind),
    ).toEqual(['call', 'whatsApp', 'map']);
  });

  it('opens the profile of an Instagram name with dots, underscores and digits as Instagram writes it', () => {
    const [, , instagram] = contactLinksOf({
      ...everyDetail,
      instagramName: 'made_up.pc_parts_2026',
    });
    expect(instagram).toEqual({
      kind: 'instagram',
      address: 'https://www.instagram.com/made_up.pc_parts_2026/',
      detail: '@made_up.pc_parts_2026',
    });
  });
});
