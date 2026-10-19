import type { ExpectedErrorResponse } from '@pcp/core/test-utils';

// The bodies of the API's refusals that several test files read, each as a
// whole. Those every API answers alike, such as `unauthorized`, are in
// `@pcp/core/test-utils`.

export const identityServiceUnavailable: ExpectedErrorResponse[] = [
  {
    code: 'IDENTITY_SERVICE_UNAVAILABLE',
    title: 'identity_service_unavailable_title',
    detail: 'identity_service_unavailable_details',
  },
];

export const vendorNotFound: ExpectedErrorResponse[] = [
  {
    code: 'VENDOR_NOT_FOUND',
    title: 'vendor_not_found_title',
    detail: 'vendor_not_found_details',
  },
];

export const internalServerError: ExpectedErrorResponse[] = [
  {
    code: 'INTERNAL_SERVER_ERROR',
    title: 'internal_server_error_title',
    detail: 'internal_server_error_details',
  },
];
