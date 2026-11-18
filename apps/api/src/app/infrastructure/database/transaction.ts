import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { Schema } from './schema';

// A transaction on the platform's database, as the client hands it to the
// work it runs in it. A writing that has to be done together with another
// Store's is handed the transaction they share, so that both are kept or
// neither is.
export type Transaction = Parameters<
  Parameters<NodePgDatabase<Schema>['transaction']>[0]
>[0];
