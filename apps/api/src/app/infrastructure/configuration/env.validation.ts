import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { IsOrigin, parseAllowedOrigins, validateEnvironment } from '@pcp/core';

// The API's settings. Each has the fixed development value as its default, so
// the API starts with no environment at all. None of them is a secret.
export class EnvironmentVariables {
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
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  return validateEnvironment(EnvironmentVariables, config);
}
