import type { ErrorResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { whyAReferralWasRefused } from '@/shared/api';

// The API's refusal, with its code and the field and reason it names.
function aRefusal(code: string, information?: Record<string, string>): ErrorResponse {
  return {
    errors: [
      {
        code,
        title: `${code}.title`,
        detail: `${code}.detail`,
        ...(information === undefined ? {} : { additionalInformation: information }),
      },
    ],
  };
}

// Why a Referral was not recorded, as "send on WhatsApp" tells it to the
// Shopper (the sharing spec's The API): a Vendor the platform can no longer
// reach, deactivated, unknown or without a WhatsApp number now; a Shared
// Build the API does not hold, which only an address changed by hand names;
// or an API that did not answer or failed, whatever its error holds.
describe('why a Referral was refused', () => {
  it('is a Vendor no longer reachable for 404 VENDOR_NOT_FOUND', () => {
    expect(
      whyAReferralWasRefused({ status: 404, error: aRefusal('VENDOR_NOT_FOUND') }),
    ).toBe('not-reachable');
  });

  it('is a Vendor no longer reachable for a 400 that names `vendorId`', () => {
    expect(
      whyAReferralWasRefused({
        status: 400,
        error: aRefusal('NOT_VALID', { field: 'vendorId', reason: 'noWhatsAppNumber' }),
      }),
    ).toBe('not-reachable');
  });

  it('is no Shared Build for 404 SHARED_BUILD_NOT_FOUND', () => {
    expect(
      whyAReferralWasRefused({ status: 404, error: aRefusal('SHARED_BUILD_NOT_FOUND') }),
    ).toBe('no-shared-build');
  });

  it('is an API that did not answer for anything else', () => {
    expect(whyAReferralWasRefused({ status: undefined, error: undefined })).toBe(
      'not-answered',
    );
    expect(
      whyAReferralWasRefused({ status: 503, error: aRefusal('DATABASE_UNAVAILABLE') }),
    ).toBe('not-answered');
    expect(
      whyAReferralWasRefused({
        status: 400,
        error: aRefusal('NOT_VALID', { field: 'part', reason: 'empty' }),
      }),
    ).toBe('not-answered');
  });

  // The client hands back what the request threw when no answer came, and
  // a proxy's page in front of a failing API holds no list of errors.
  it('is an API that did not answer for an error that is not the API’s', () => {
    const thrown = new TypeError('fetch failed') as unknown as ErrorResponse;
    expect(whyAReferralWasRefused({ status: undefined, error: thrown })).toBe(
      'not-answered',
    );
    const page = '<html>Bad gateway</html>' as unknown as ErrorResponse;
    expect(whyAReferralWasRefused({ status: 502, error: page })).toBe('not-answered');
    expect(
      whyAReferralWasRefused({ status: 404, error: {} as unknown as ErrorResponse }),
    ).toBe('not-answered');
  });
});
