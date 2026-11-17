import type { ErrorResponse, SubErrorResponse } from '@pcp/api-client';

// Why the API did not record a Referral, for "send on WhatsApp" (the
// sharing spec's The API): a Vendor the platform can no longer reach,
// deactivated or unknown (404 `VENDOR_NOT_FOUND`) or without a WhatsApp
// number now (400 naming `vendorId`); a Shared Build it does not hold (404
// `SHARED_BUILD_NOT_FOUND`), which only an address changed by hand names;
// or an API that did not answer, or failed.
export type ReferralRefused = 'not-reachable' | 'no-shared-build' | 'not-answered';

// The API's own errors in what the client handed back, or none: with no
// answer the client hands back what the request threw, and a proxy's page in
// front of a failing API holds no list of errors.
function theApisErrors(error: ErrorResponse | undefined): SubErrorResponse[] {
  const errors: unknown = (error as { errors?: unknown } | undefined)?.errors;
  return Array.isArray(errors) ? (errors as SubErrorResponse[]) : [];
}

// Why a Referral was refused, from the status the API answered with, none
// when it did not answer, and the error the client handed back.
export function whyAReferralWasRefused({
  status,
  error,
}: {
  status: number | undefined;
  error: ErrorResponse | undefined;
}): ReferralRefused {
  const errors = theApisErrors(error);
  const codes = errors.map(({ code }) => code);
  if (status === 404 && codes.includes('SHARED_BUILD_NOT_FOUND')) return 'no-shared-build';
  if (status === 404 && codes.includes('VENDOR_NOT_FOUND')) return 'not-reachable';
  const namesTheVendor = errors.some(
    ({ additionalInformation }) => additionalInformation?.field === 'vendorId',
  );
  if (status === 400 && namesTheVendor) return 'not-reachable';
  return 'not-answered';
}
