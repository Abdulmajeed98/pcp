import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from '~/app.module';

// The API's fixed development port. Reading it from configuration arrives with
// the first feature that needs configuration.
const PORT = 3001;

export async function bootstrap(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  await app.listen(PORT);
  Logger.log(`API listening on http://localhost:${PORT}`);

  return app;
}
