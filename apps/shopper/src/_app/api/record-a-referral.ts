import { apiClient } from '@/shared/api';

// The Vendor a Referral was recorded for, as the API answers it: its name as
// it wrote it, and the WhatsApp number its chat is opened with.
export interface Referred {
  name: string;
  whatsAppNumber: { international: string };
}

// What recording a Referral came to: the Vendor, its Referral recorded; a
// Vendor the platform can no longer reach, deactivated, unknown or with no
// WhatsApp number now, which the API refuses with 404 `VENDOR_NOT_FOUND` or
// 400 naming `vendorId`; a Shared Build the API does not hold, 404
// `SHARED_BUILD_NOT_FOUND`, which only an address changed by hand names; or
// nothing, when the API did not answer, or failed.
export type Referral =
  | { kind: 'referred'; vendor: Referred }
  | { kind: 'not-reachable' }
  | { kind: 'no-shared-build' }
  | { kind: 'not-answered' };

// Records a Referral on the server, for "send on WhatsApp" (`POST
// v1/shared-builds/{id}/referrals`, SHR-6): one tap, one Referral, holding
// the Vendor, the Shared Build and the moment, and nothing about the
// Shopper. The API records one only for an active Vendor that gave a
// WhatsApp number, and answers that number, so that the chat is opened with
// the number the platform holds now, never a copy the page was drawn with.
// The browser never calls the API.
export async function recordAReferral(
  sharedBuildId: string,
  vendorId: string,
): Promise<Referral> {
  const { data, error, response } = await apiClient().recordReferral({
    path: { sharedBuildId },
    body: { vendorId },
  });
  if (data !== undefined) return { kind: 'referred', vendor: data.vendor };
  const codes = error?.errors.map(({ code }) => code) ?? [];
  if (response?.status === 404 && codes.includes('SHARED_BUILD_NOT_FOUND')) {
    return { kind: 'no-shared-build' };
  }
  if (response?.status === 404 && codes.includes('VENDOR_NOT_FOUND')) {
    return { kind: 'not-reachable' };
  }
  const namesTheVendor =
    error?.errors.some(
      ({ additionalInformation }) => additionalInformation?.field === 'vendorId',
    ) ?? false;
  if (response?.status === 400 && namesTheVendor) return { kind: 'not-reachable' };
  return { kind: 'not-answered' };
}
