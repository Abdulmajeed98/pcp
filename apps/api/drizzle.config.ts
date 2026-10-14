import { defineConfig } from 'drizzle-kit';

// What drizzle-kit generates the API's migrations from, and where it writes
// them. Generating needs no database: drizzle-kit compares the schema with the
// snapshot it keeps beside the migrations.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/app/infrastructure/**/*.schema.ts',
  out: './src/drizzle',
});
