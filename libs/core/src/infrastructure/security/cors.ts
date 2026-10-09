import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

// Reads the setting that lists the allowed origins: one string, with the
// origins separated by commas.
export function parseAllowedOrigins(value: unknown): Set<string> {
  if (value instanceof Set) return value;

  return new Set(
    String(value ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  );
}

// An origin is what a browser names as the place a call comes from: a scheme,
// a host and a port, written the way a browser writes them, and no path.
export function isOrigin(value: unknown): boolean {
  if (typeof value !== 'string' || !URL.canParse(value)) return false;

  const { origin, protocol } = new URL(value);
  return origin === value && (protocol === 'http:' || protocol === 'https:');
}

// A request that names no origin was not made by a page in a browser, so the
// rule does not concern it. It still has to pass the guard like any other.
export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: Set<string>,
): boolean {
  return origin === undefined || allowedOrigins.has(origin);
}

export function getCorsConfiguration(allowedOrigins: Set<string>): CorsOptions {
  return {
    origin: (origin: string | undefined, callback) => {
      callback(null, isOriginAllowed(origin, allowedOrigins));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  };
}
