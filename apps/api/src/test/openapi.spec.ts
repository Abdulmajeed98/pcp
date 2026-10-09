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

  it('names each operation after the method that serves it, and no two alike', () => {
    const names = Object.values(document.paths).flatMap((path) =>
      Object.values(path).map(
        (operation) => (operation as { operationId: string }).operationId,
      ),
    );

    expect(names).toContain('getCaller');
    expect(names).toContain('getStatus');
    expect(new Set(names).size).toBe(names.length);
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
    const operations = Object.values(document.paths).flatMap((path) => Object.values(path));

    expect(operations.length).toBeGreaterThan(0);
    for (const operation of operations) {
      expect(
        (operation as { responses: Record<string, unknown> }).responses.default,
      ).toMatchObject({
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
