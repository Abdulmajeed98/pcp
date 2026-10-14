import { sql } from 'drizzle-orm';
import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// A relative path and not the `~/` alias, because drizzle-kit reads this file
// by itself when it generates a migration, and it knows no alias.
import { Category } from '../../domain/part/Category';
import { SpecificationDocument } from '../../domain/specification/specification-document';

// The database's list of Categories is the domain's. Drizzle wants it as a
// list that is known not to be empty.
const [firstCategory, ...otherCategories] = Category.keys();

export const partCategory = pgEnum('part_category', [firstCategory, ...otherCategories]);

export const part = pgTable('part', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Empty for a Part that the Admin created rather than imported.
  openDbId: uuid('open_db_id').unique(),
  category: partCategory('category').notNull(),
  name: text('name').notNull(),
  manufacturer: text('manufacturer').notNull(),
  partNumbers: text('part_numbers')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  // One document per Part, in OpenDB's field names and nesting, holding only
  // what the Category's specification list names.
  specifications: jsonb('specifications')
    .$type<SpecificationDocument>()
    .notNull()
    .default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type PartRow = typeof part.$inferSelect;
