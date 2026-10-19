// PostgreSQL's code for a row refused by a unique rule.
const uniqueViolation = '23505';

// Whether a query was refused because it broke the unique rule of this name,
// as when two requests store the same thing at once. Drizzle wraps what `pg`
// threw as the cause of its own error, so the causes are looked at, a few
// levels deep.
export function brokeUniqueRule(error: unknown, rule: string): boolean {
  let current = error;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== 'object' || current === null) return false;
    const { code, constraint, cause } = current as {
      code?: unknown;
      constraint?: unknown;
      cause?: unknown;
    };
    if (code === uniqueViolation && constraint === rule) return true;
    current = cause;
  }
  return false;
}
