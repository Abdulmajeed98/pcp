import type { ErrorResponse, SubErrorResponse } from '@pcp/api-client';

// The API answered, and refused: its status, and the errors its body names.
// A form reads an error's `additionalInformation.field` to show it beside the
// field it is about.
export class Refusal extends Error {
  constructor(
    readonly status: number,
    readonly errors: readonly SubErrorResponse[],
  ) {
    super(`The API refused the call with ${status}`);
  }

  // The first error's code, such as `PART_NOT_FOUND`, or `UNKNOWN` when the
  // answer named none.
  get code(): string {
    return this.errors[0]?.code ?? 'UNKNOWN';
  }

  // Why the API refused a field of the request, such as `photo`, by the
  // reason its error about that field gives, if it gave one.
  reasonFor(field: string): string | undefined {
    return this.errors.find((each) => each.additionalInformation?.field === field)
      ?.additionalInformation?.reason;
  }
}

// The API was never asked: it could not be reached, or no token could be had
// for the call because Keycloak could not be asked.
export class Unreachable extends Error {
  constructor() {
    super('The API cannot be reached');
  }
}

// What a call of `@pcp/api-client` answers with: the data, or the API's error
// body. When the request cannot be made, the generated client answers
// without a response.
type Answer<Data> = {
  data?: Data;
  error?: ErrorResponse | unknown;
  response?: Response;
};

// The data of a call to the API, or a `Refusal` or an `Unreachable` thrown.
// `@pcp/api-client`'s calls never throw, and TanStack Query treats a call as
// failed only when it throws, so every query and every change goes through
// this. A refusal is shown as one, and never answered by starting a login.
export async function dataOf<Data>(call: Promise<Answer<Data>>): Promise<Data> {
  const { data, error, response } = await call;
  if (response === undefined) throw new Unreachable();
  if (!response.ok || data === undefined) {
    throw new Refusal(response.status, errorsIn(error));
  }

  return data;
}

function errorsIn(body: unknown): SubErrorResponse[] {
  const errors = (body as Partial<ErrorResponse> | undefined)?.errors;
  return Array.isArray(errors) ? errors : [];
}
