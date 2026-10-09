import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { expectErrorResponseShape } from '@pcp/core/test-utils';

import { createTestApp, TestApp } from './test-utils/create-test-app';

// Endpoints the real API does not have: each fails in a way of its own.
@Controller()
class FailingController {
  @Get('test/unexpected-failure')
  failUnexpectedly(): never {
    throw new Error('the database password is hunter2');
  }

  @Get('test/teapot')
  refuseToBrewCoffee(): never {
    throw new HttpException('short and stout', HttpStatus.I_AM_A_TEAPOT);
  }
}

describe('the application as it is set up', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({ controllers: [FailingController] });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('an error', () => {
    it('has the agreed body when the path does not exist', async () => {
      const response = await fetch(`${testApp.baseUrl}/v1/nothing-here`);

      expect(response.status).toBe(404);
      expectErrorResponseShape(await response.json(), [
        { code: 'NOT_FOUND', title: 'not_found_title', detail: 'not_found_details' },
      ]);
    });

    it('has the agreed body when an endpoint fails unexpectedly, and says nothing of the failure', async () => {
      const response = await fetch(`${testApp.baseUrl}/test/unexpected-failure`);

      expect(response.status).toBe(500);
      const body = await response.text();
      expect(body).not.toContain('hunter2');
      expectErrorResponseShape(JSON.parse(body), [
        {
          code: 'INTERNAL_SERVER_ERROR',
          title: 'internal_server_error_title',
          detail: 'internal_server_error_details',
        },
      ]);
    });

    it('has the agreed body, told apart by its status, when an endpoint answers any other error', async () => {
      const response = await fetch(`${testApp.baseUrl}/test/teapot`);

      expect(response.status).toBe(418);
      const body = await response.text();
      expect(body).not.toContain('stout');
      expectErrorResponseShape(JSON.parse(body), [
        { code: 'HTTP_418', title: 'http_error_title', detail: 'http_error_details' },
      ]);
    });
  });

  describe('a browser call', () => {
    // What a browser sends before a call to another origin, to ask whether
    // the call is allowed.
    function preflight(origin: string): Promise<Response> {
      return fetch(`${testApp.baseUrl}/v1/status`, {
        method: 'OPTIONS',
        headers: { origin, 'access-control-request-method': 'GET' },
      });
    }

    it("is accepted from the dashboard's address", async () => {
      const response = await preflight('http://localhost:3002');

      expect(response.headers.get('access-control-allow-origin')).toBe(
        'http://localhost:3002',
      );
    });

    it('is not accepted from another address', async () => {
      const response = await preflight('http://localhost:4000');

      expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });

    it('is not what a request that names no origin is, and such a request is answered', async () => {
      const response = await fetch(`${testApp.baseUrl}/v1/status`);

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });
  });
});
