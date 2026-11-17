import type { ErrorResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { refusesTheBuild } from '@/shared/api';

// The API's refusal of a value, as it names the field it refuses.
function aRefusalOf(field: string): ErrorResponse {
  return {
    errors: [
      {
        code: 'NOT_VALID',
        title: 'NOT_VALID.title',
        detail: 'NOT_VALID.detail',
        additionalInformation: { field, reason: 'quantityMissing' },
      },
    ],
  };
}

// A Build the API refuses, such as a cookie edited by hand that files a RAM
// kit under the CPU, is told apart from an API that does not answer, so that
// the Build page offers to empty it rather than to try again, and the picker
// leads to the Build page (the owner's answer of 13 November 2026).
describe('whether the API refuses the Build it was given', () => {
  it('is so for a 400 that names `part`, the Build', () => {
    expect(refusesTheBuild({ status: 400, error: aRefusalOf('part') })).toBe(true);
  });

  it('is not so for a 400 that names another field', () => {
    expect(refusesTheBuild({ status: 400, error: aRefusalOf('currency') })).toBe(false);
  });

  it('is not so for an API that did not answer, nor for one that failed', () => {
    expect(refusesTheBuild({ status: undefined, error: undefined })).toBe(false);
    expect(refusesTheBuild({ status: 503, error: aRefusalOf('part') })).toBe(false);
    expect(refusesTheBuild({ status: 500, error: undefined })).toBe(false);
  });

  // A proxy in front of the API, or one that stands in for it while it
  // fails, can answer 400 with a body of its own: a page, or an error that
  // is not the API's. The client hands that body back as the error, so such
  // an answer is read as an API that did not answer, never thrown on.
  it('is not so for a 400 whose body is not the API’s', () => {
    for (const body of [
      '<html><body>400 Bad Request</body></html>',
      { message: 'Bad Request' },
      { errors: 'part' },
      null,
    ]) {
      expect(
        refusesTheBuild({ status: 400, error: body as unknown as ErrorResponse }),
      ).toBe(false);
    }
  });
});
