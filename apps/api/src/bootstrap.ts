import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getCorsConfiguration } from '@pcp/core';

import { AppModule } from '~/app.module';
import { EnvironmentVariables } from '~/infrastructure/configuration/env.validation';

function settingsOf(
  app: NestExpressApplication,
): ConfigService<EnvironmentVariables, true> {
  return app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
}

// Sets the application up, apart from starting it. The real start and every
// test call this, so that a test never runs against an API set up differently.
export function configureApplication(app: NestExpressApplication): void {
  const allowedOrigins = settingsOf(app).get('CORS_ALLOWED_ORIGINS', { infer: true });

  app.enableCors(getCorsConfiguration(allowedOrigins));
}

export async function bootstrap(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configureApplication(app);

  const port = settingsOf(app).get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}`);

  return app;
}
