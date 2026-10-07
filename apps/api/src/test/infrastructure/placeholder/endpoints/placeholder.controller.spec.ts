import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '~/app.module';

describe('placeholder endpoint', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers a request to the root with the names of the API and its libraries', async () => {
    const response = await fetch(`${baseUrl}/`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      name: '@pcp/api',
      libraries: ['@pcp/core', '@pcp/compatibility'],
    });
  });
});
