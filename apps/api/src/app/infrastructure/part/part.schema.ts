import { sql } from 'drizzle-orm';
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// A relative path and not the `~/` alias, because drizzle-kit reads this file
// by itself when it generates a migration, and it knows no alias.
import { Category } from '../../domain/part/Category';
import { SpecificationDocument } from '../../domain/specification/specification-document';

// The database's list of Categories is the domain's. Drizzle wants it as a
// list that is known not to be empty.
const [firstCategory, ...otherCategories] = Category.keys();

export const partCategory = pgEnum('part_category', [firstCategory, ...otherCategories]);

export const part = pgTable(
  'part',
  {
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
    // Set by the database's clock on every change, as the time of creation is,
    // so that the two never disagree about which came first.
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
    // The name, the manufacturer and the part numbers, in lower case, kept by
    // the Store whenever they change, for searching. The trigram index finds a
    // word anywhere in it.
    searchText: text('search_text').notNull().default(''),
  },
  (table) => [
    index('part_search_text_index').using('gin', table.searchText.op('gin_trgm_ops')),
  ],
);

export type PartRow = typeof part.$inferSelect;
