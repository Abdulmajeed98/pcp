import type { ReferredVendorResponse } from '@pcp/api-client';

import { apiClient, type ReferralRefused, whyAReferralWasRefused } from '@/shared/api';

// What recording a Referral came to, which is a Referral only when it was
// recorded: the Vendor it was recorded for, as the API answers it, its name
// as it wrote it and the WhatsApp number its chat is opened with; or why
// none was (`whyAReferralWasRefused`): a Vendor the platform can no longer
// reach, a Shared Build the API does not hold, or an API that did not
// answer.
export type RecordingOutcome =
  | { kind: 'referred'; vendor: ReferredVendorResponse }
  | { kind: ReferralRefused };

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
): Promise<RecordingOutcome> {
  const { data, error, response } = await apiClient().recordReferral({
    path: { sharedBuildId },
    body: { vendorId },
  });
  if (data !== undefined) return { kind: 'referred', vendor: data.vendor };
  return { kind: whyAReferralWasRefused({ status: response?.status, error }) };
}
