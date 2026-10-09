import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createOpenApiDocument } from '../openapi';
import { createTestApp, TestApp } from './test-utils/create-test-app';

// The document as it is committed, which `pnpm api-client:write` writes and
// the frontends' client is generated from.
const committedDocument = join(__dirname, '..', '..', 'openapi.json');

describe("the API's description of itself", () => {
  let testApp: TestApp;
  let document: ReturnType<typeof createOpenApiDocument>;

  beforeAll(async () => {
    testApp = await createTestApp();
    // Through JSON and back, as the committed document has been.
    document = JSON.parse(JSON.stringify(createOpenApiDocument(testApp.app)));
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('is what is committed, so that the client is never generated from a stale one', () => {
    const committed = JSON.parse(readFileSync(committedDocument, 'utf8'));

    expect(document).toEqual(committed);
  });

  it('describes the two endpoints and no other', () => {
    expect(Object.keys(document.paths).sort()).toEqual(['/v1/caller', '/v1/status']);
    expect(Object.keys(document.paths['/v1/caller'])).toEqual(['get']);
    expect(Object.keys(document.paths['/v1/status'])).toEqual(['get']);
  });

  it('names each operation after what it does', () => {
    expect(document.paths['/v1/caller'].get?.operationId).toBe('getCaller');
    expect(document.paths['/v1/status'].get?.operationId).toBe('getStatus');
  });

  it('declares bearer authentication once, for the whole document', () => {
    expect(document.components?.securitySchemes).toEqual({
      bearer: { scheme: 'bearer', bearerFormat: 'JWT', type: 'http' },
    });
    expect(document.security).toEqual([{ bearer: [] }]);
  });

  it('says that the public endpoint needs no login', () => {
    expect(document.paths['/v1/status'].get?.security).toEqual([]);
    expect(document.paths['/v1/caller'].get?.security).toBeUndefined();
  });

  it('states what each endpoint answers', () => {
    expect(document.paths['/v1/status'].get?.responses['200']).toMatchObject({
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/StatusResponse' } },
      },
    });
    expect(document.paths['/v1/caller'].get?.responses['200']).toMatchObject({
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/CallerResponse' } },
      },
    });
    expect(document.components?.schemas?.StatusResponse).toMatchObject({
      type: 'object',
      required: ['startedAt'],
      properties: { startedAt: { type: 'string', format: 'date-time' } },
    });
    expect(document.components?.schemas?.CallerResponse).toMatchObject({
      type: 'object',
      required: ['id', 'loginName', 'roles'],
      properties: {
        id: { type: 'string' },
        loginName: { type: 'string' },
        roles: { type: 'array', items: { type: 'string', enum: ['admin', 'vendor'] } },
      },
    });
  });

  it('states the error body as the answer for any refusal, at every endpoint', () => {
    for (const path of ['/v1/caller', '/v1/status']) {
      expect(document.paths[path].get?.responses.default).toMatchObject({
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      });
    }
    expect(document.components?.schemas?.ErrorResponse).toMatchObject({
      type: 'object',
      required: ['errors'],
      properties: {
        errors: { type: 'array', items: { $ref: '#/components/schemas/SubErrorResponse' } },
      },
    });
    expect(document.components?.schemas?.SubErrorResponse).toMatchObject({
      type: 'object',
      required: ['code', 'title', 'detail'],
      properties: {
        code: { type: 'string' },
        title: { type: 'string' },
        detail: { type: 'string' },
      },
    });
  });
});
