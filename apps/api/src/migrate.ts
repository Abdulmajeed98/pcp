import { join } from 'node:path';

import { validate } from '~/infrastructure/configuration/env.validation';
import { applyMigrations } from '~/infrastructure/database/migrations';

// Applies the committed migrations to the database the API's settings name,
// and says what it did. Run it with `pnpm db:migrate`, and `pnpm services:up`
// runs it too. The API never applies migrations when it starts, so that two
// APIs starting at once cannot both change the database.
async function migrateTheDatabase(): Promise<number> {
  let settings: ReturnType<typeof validate>;
  try {
    settings = validate(process.env);
  } catch (error) {
    console.error((error as Error).message);
    return 1;
  }

  const datasource = {
    url: settings.DATASOURCE_URL,
    username: settings.DATASOURCE_USERNAME,
    password: settings.DATASOURCE_PASSWORD,
  };

  try {
    const outcome = await applyMigrations(datasource, join(__dirname, 'drizzle'));
    if (outcome.kind === 'locked') {
      console.error(
        'Another run is applying the migrations, so this one applied none. Run it again when that one has finished.',
      );
      return 1;
    }
    console.log(
      outcome.count === 0
        ? 'The database already has every migration.'
        : `Applied ${outcome.count} migration${outcome.count === 1 ? '' : 's'}.`,
    );
    return 0;
  } catch (error) {
    console.error(`The migrations could not be applied: ${(error as Error).message}`);
    return 1;
  }
}

void migrateTheDatabase().then((code) => {
  process.exitCode = code;
});
