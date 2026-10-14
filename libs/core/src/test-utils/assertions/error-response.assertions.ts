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
