import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, IsUrl, Matches, Max, Min } from 'class-validator';
import {
  CoreEnvironmentVariables,
  IsOrigin,
  parseAllowedOrigins,
  validateEnvironment,
} from '@pcp/core';
import { openDbRepository } from '@pcp/opendb';

// The API's settings. Each has the fixed development value as its default,
// apart from the database password and the API's client's secret, which are
// secrets and have none. The API refuses to start without either.
export class EnvironmentVariables extends CoreEnvironmentVariables {
  @IsInt()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => Number(value))
  PORT = 3001;

  // The origins the API accepts browser calls from, separated by commas. The
  // default is the dashboard's development address.
  @IsOrigin({ each: true })
  @Transform(({ value }) => parseAllowedOrigins(value))
  CORS_ALLOWED_ORIGINS = new Set(['http://localhost:3002']);

  // Where the platform's database is: its host, its port and the database's
  // name. A login or options written into it are not read; the login is the
  // next two settings. The default is the development database.
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    protocols: ['postgresql', 'postgres'],
  })
  DATASOURCE_URL = 'postgresql://localhost:5432/pcp';

  // The database user the API logs in as, which owns the platform's database.
  @IsString()
  @IsNotEmpty()
  DATASOURCE_USERNAME = 'pcp';

  // That user's password. In development it is the one `.env` holds for the
  // `pcp` user.
  @IsString()
  @IsNotEmpty()
  DATASOURCE_PASSWORD!: string;

  // Where OpenDB is kept, from which the import fetches the archive of the
  // pinned commit when it is given no folder. The default is OpenDB's own
  // repository on GitHub. Only the import reads it.
  //
  // The import takes the commit an archive names in its own header, so the
  // archive has to come over HTTPS, which no one on the way can change. Plain
  // HTTP is taken only from this machine, where the tests' stand-in for
  // GitHub listens.
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['https', 'http'] })
  @Matches(/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$))/, {
    message: 'OPENDB_REPOSITORY_URL must use HTTPS, unless it names this machine',
  })
  OPENDB_REPOSITORY_URL = openDbRepository;

  // Where Keycloak is, whose administration interface the API manages Logins
  // through. It is apart from the issuer, so that the tests can check tokens
  // against a stand-in while they manage Logins in a real Keycloak. The
  // default is the development Keycloak.
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  KEYCLOAK_URL = 'http://localhost:8080';

  // The realm whose Logins the API manages.
  @IsString()
  @IsNotEmpty()
  KEYCLOAK_REALM = 'pcp';

  // The API's own client in that realm, whose service account may manage the
  // realm's Logins.
  @IsString()
  @IsNotEmpty()
  KEYCLOAK_CLIENT_ID = 'pcp-api';

  // That client's secret, which the realm was given when it was imported.
  @IsString()
  @IsNotEmpty()
  KEYCLOAK_CLIENT_SECRET!: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  return validateEnvironment(EnvironmentVariables, config);
}
