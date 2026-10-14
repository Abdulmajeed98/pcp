import { expect } from '@jest/globals';

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
