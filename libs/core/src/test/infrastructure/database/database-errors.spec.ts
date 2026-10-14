import { databaseErrorOf } from '../../../infrastructure/database/database-errors';

// What `pg` and Drizzle throw, written out by hand in the shapes they have:
// Drizzle's error carries what `pg` threw as its cause.
function failedQuery(cause: unknown): Error {
  return new Error('Failed query: select 1', { cause });
}

function withCode(message: string, code: string): Error {
  return Object.assign(new Error(message), { code });
}

describe('the error a Store returns for a failed query', () => {
  it.each([
    ['a refused connection', failedQuery(withCode('connect ECONNREFUSED', 'ECONNREFUSED'))],
    [
      'a connection refused at every address tried',
      failedQuery(
        new AggregateError([
          withCode('connect ECONNREFUSED ::1:5432', 'ECONNREFUSED'),
          withCode('connect ECONNREFUSED 127.0.0.1:5432', 'ECONNREFUSED'),
        ]),
      ),
    ],
    [
      'a host that does not exist',
      failedQuery(withCode('getaddrinfo ENOTFOUND db', 'ENOTFOUND')),
    ],
    [
      'a connection the server ended as it stopped',
      failedQuery(withCode('terminating connection due to administrator command', '57P01')),
    ],
    [
      'a server that is still starting',
      failedQuery(withCode('the database system is starting up', '57P03')),
    ],
    ['a connection exception', failedQuery(withCode('connection failure', '08006'))],
    [
      'a connection that ended without a word',
      failedQuery(new Error('Connection terminated unexpectedly')),
    ],
    [
      'a connection that did not open in time',
      failedQuery(new Error('timeout exceeded when trying to connect')),
    ],
  ])('says the database is unavailable for %s', (_case, error) => {
    const returned = databaseErrorOf(error, 'A Part could not be read');

    expect(returned.getType()).toBe('SERVICE_UNAVAILABLE');
    expect(returned.getCode()).toBe('DATABASE_UNAVAILABLE');
  });

  it.each([
    [
      'a broken rule of the database',
      failedQuery(withCode('duplicate key value violates unique constraint', '23505')),
    ],
    [
      'a mistake in the query',
      failedQuery(withCode('syntax error at or near "selec"', '42601')),
    ],
    ['something that is not an error at all', 'nothing'],
  ])('says it is a server error for %s', (_case, error) => {
    const returned = databaseErrorOf(error, 'A Part could not be read');

    expect(returned.getType()).toBe('SERVER_ERROR');
    expect(returned.getCode()).toBe('INTERNAL_SERVER_ERROR');
  });
});
