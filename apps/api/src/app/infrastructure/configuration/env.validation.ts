import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, IsUrl, Max, Min } from 'class-validator';
import {
  CoreEnvironmentVariables,
  IsOrigin,
  parseAllowedOrigins,
  validateEnvironment,
} from '@pcp/core';

// The API's settings. Each has the fixed development value as its default,
// apart from the database password, which is a secret and has none. The API
// refuses to start without it.
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
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  return validateEnvironment(EnvironmentVariables, config);
}
