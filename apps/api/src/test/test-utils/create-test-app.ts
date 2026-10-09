import { Type } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

export type TestApp = {
  app: NestExpressApplication;
  baseUrl: string;
};

type TestAppOptions = {
  // Endpoints a test needs and the real API does not have.
  controllers?: Type[];
};

// Builds the application the way the real start does: from the real root
// module, set up by the same function, and listening on a port. The port is a
// free one, and requests are sent to it over HTTP.
export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  // Imported here and not at the top of the file. The root module reads the
  // settings when it is loaded, so a test can still change one before this.
  const { AppModule } = await import('~/app.module');
  const { configureApplication } = await import('../../bootstrap');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: options.controllers ?? [],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApplication(app);
  await app.listen(0, '127.0.0.1');

  return { app, baseUrl: await app.getUrl() };
}
