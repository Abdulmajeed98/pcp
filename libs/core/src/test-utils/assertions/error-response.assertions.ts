import type { expect as jestExpect } from '@jest/globals';

// Jest gives every test file `expect` as a global, and it is read from there
// rather than imported. Jest refuses `@jest/globals` outside a test file, and
// this entry is also loaded by the global set-up of the tests against a real
// database, which runs before any test file.
declare const expect: typeof jestExpect;

export type ExpectedErrorResponse = {
  code: string;
  title: string;
  detail: string;
  additionalInformation?: Record<string, string>;
};

// Asserts that a body is the agreed error body and nothing more: a list of
// errors, each with a code, a title and a detail.
export function expectErrorResponseShape(
  body: unknown,
  expectedErrors: ExpectedErrorResponse[],
): void {
  expect(body).toEqual({ errors: expectedErrors });
}

// Asserts that a response is a refusal: the status expected, with the agreed
// error body.
export async function expectErrorResponse(
  response: Response,
  status: number,
  expectedErrors: ExpectedErrorResponse[],
): Promise<void> {
  expect(response.status).toBe(status);
  expectErrorResponseShape(await response.json(), expectedErrors);
}

// The body of a refusal for a call without a good token, as a whole.
export const unauthorized: ExpectedErrorResponse[] = [
  { code: 'UNAUTHORIZED', title: 'unauthorized_title', detail: 'unauthorized_details' },
];

// The body of a refusal for a caller that lacks the role, as a whole.
export const accessDenied: ExpectedErrorResponse[] = [
  { code: 'ACCESS_DENIED', title: 'access_denied_title', detail: 'access_denied_details' },
];

// One error of a request that broke a rule, naming the field it got wrong,
// and anything more the error says about it.
export function notValid(
  field: string,
  more: Record<string, string> = {},
): ExpectedErrorResponse {
  return {
    code: 'NOT_VALID',
    title: 'not_valid_title',
    detail: 'not_valid_details',
    additionalInformation: { field, ...more },
  };
}
