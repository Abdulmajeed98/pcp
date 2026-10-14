import { customType, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { part } from '../part/part.schema';

// PostgreSQL's type for bytes, which Drizzle 0.45 has no column for of its own.
const bytes = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
});

// One photo for a Part at most, kept as the WebP image the API serves.
export const partPhoto = pgTable('part_photo', {
  id: uuid('id').defaultRandom().primaryKey(),
  partId: uuid('part_id')
    .notNull()
    .unique()
    .references(() => part.id),
  image: bytes('image').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
