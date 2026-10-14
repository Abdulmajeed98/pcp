import {
  ServerError,
  ServiceUnavailableError,
  StructuredError,
} from '../../domain/errors/StructuredError';

// The codes Node gives a connection that could not be made or was lost.
const networkCodes = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'EPIPE',
]);

// PostgreSQL's own codes for the same: every connection exception (class
// 08), and a server that is shutting down or not yet accepting connections.
function isUnavailableSqlState(code: string): boolean {
  return code.startsWith('08') || ['57P01', '57P02', '57P03'].includes(code);
}

// What `pg` says, without a code, when a connection ends or never opens in
// time.
const unavailableMessages = [
  'Connection terminated',
  'timeout exceeded when trying to connect',
];

// Drizzle wraps what `pg` threw as the cause of its own error, and Node gives
// a connection it tried at several addresses as an error of errors. Every
// error in that tree is looked at, a few levels deep. An error is known by its
// shape and not by its class, because one made by Node itself is not an
// instance of the `Error` that code run by Jest sees.
function errorsIn(error: unknown, depth = 0): unknown[] {
  if (typeof error !== 'object' || error === null || depth > 4) return [];
  const { cause, errors } = error as { cause?: unknown; errors?: unknown };
  const inner = Array.isArray(errors) ? errors : [];

  return [
    error,
    ...errorsIn(cause, depth + 1),
    ...inner.flatMap((each) => errorsIn(each, depth + 1)),
  ];
}

function isUnavailable(error: unknown): boolean {
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof code === 'string' && (networkCodes.has(code) || isUnavailableSqlState(code))) {
    return true;
  }
  return (
    typeof message === 'string' &&
    unavailableMessages.some((unavailable) => message.includes(unavailable))
  );
}

// The error a Store returns when a query fails. A database that cannot be
// reached is answered 503, so that the caller knows to try again. Anything
// else is a server error. Either way, what failed goes to the log only.
export function databaseErrorOf(error: unknown, message: string): StructuredError {
  return errorsIn(error).some(isUnavailable)
    ? ServiceUnavailableError.of('DATABASE_UNAVAILABLE', message)
    : ServerError.of(message);
}
