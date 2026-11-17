import type { ErrorResponse, SubErrorResponse } from '@pcp/api-client';

// The API's own errors in what the client handed back as an error, or none.
// With no answer the client hands back what the request threw, and a proxy
// in front of a failing API answers with a page or an error of its own,
// which holds no list of errors; reading either as the API's would throw.
// Every refusal the Shopper app reads, it reads through this.
export function theApisErrors(error: ErrorResponse | undefined): SubErrorResponse[] {
  const errors: unknown = (error as { errors?: unknown } | null | undefined)?.errors;
  return Array.isArray(errors) ? (errors as SubErrorResponse[]) : [];
}
