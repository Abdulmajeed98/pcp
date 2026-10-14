// What kind of failure an error is. The HTTP layer answers each kind with a
// status of its own.
export type ErrorType =
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR';

// A failure that domain and Store code returns, as the left side of an
// `Either`, instead of throwing. Its code is fixed, and its title and detail
// are keys that the frontends turn into text, derived from the code.
//
// The message is for the log only and never leaves the API. The additional
// information is fixed keys and values a frontend can act on, such as the
// field a refusal is about.
export class StructuredError {
  constructor(
    private readonly code: string,
    private readonly message: string,
    private readonly type: ErrorType,
    private readonly additionalInformation: Readonly<Record<string, string>> = {},
  ) {}

  getCode(): string {
    return this.code;
  }

  getTitle(): string {
    return `${this.code.toLowerCase()}_title`;
  }

  getDetail(): string {
    return `${this.code.toLowerCase()}_details`;
  }

  getMessage(): string {
    return this.message;
  }

  getType(): ErrorType {
    return this.type;
  }

  getAdditionalInformation(): Readonly<Record<string, string>> {
    return this.additionalInformation;
  }
}

// Something failed that the caller could not have prevented, such as the
// database refusing a query. It is answered as an internal error, and only
// the log says what it was.
export class ServerError extends StructuredError {
  static of(message: string): ServerError {
    return new ServerError('INTERNAL_SERVER_ERROR', message, 'SERVER_ERROR');
  }
}

// Something the API needs, such as its database, cannot be reached now. The
// caller may try again later. Each such thing has a code of its own, such as
// `DATABASE_UNAVAILABLE`.
export class ServiceUnavailableError extends StructuredError {
  static of(code: string, message: string): ServiceUnavailableError {
    return new ServiceUnavailableError(code, message, 'SERVICE_UNAVAILABLE');
  }
}

// What the caller asked for does not exist. Each kind of thing that can be
// missing has a code of its own, such as `PART_NOT_FOUND`.
export class NotFoundError extends StructuredError {
  static of(code: string, message: string): NotFoundError {
    return new NotFoundError(code, message, 'NOT_FOUND');
  }
}

// What the caller sent breaks a rule. The additional information names what
// it is about.
export class NotValidError extends StructuredError {
  static of(
    code: string,
    message: string,
    additionalInformation: Readonly<Record<string, string>> = {},
  ): NotValidError {
    return new NotValidError(code, message, 'VALIDATION_ERROR', additionalInformation);
  }
}
