import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ErrorStructureException, NotFoundError, Public, ServerError } from '@pcp/core';
import {
  expectErrorResponse,
  expectErrorResponseShape,
  notValid,
} from '@pcp/core/test-utils';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

import { createTestApp, TestApp } from './test-utils/create-test-app';

// A request with rules of its own, for an endpoint below.
class ThingRequest {
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @IsInt()
  readonly count!: number;
}

// Endpoints the real API does not have: each fails in a way of its own. They
// are open to anyone, so that the failure is the endpoint's and not the guard's.
@Controller()
class FailingController {
  @Public()
  @Get('test/unexpected-failure')
  failUnexpectedly(): never {
    throw new Error('the database password is hunter2');
  }

  @Public()
  @Get('test/teapot')
  refuseToBrewCoffee(): never {
    throw new HttpException('short and stout', HttpStatus.I_AM_A_TEAPOT);
  }

  // What a controller does when its use case returns an error.
  @Public()
  @Get('test/missing-thing')
  findNothing(): never {
    throw ErrorStructureException.of(NotFoundError.of('THING_NOT_FOUND', 'No thing 42'));
  }

  @Public()
  @Get('test/use-case-failure')
  failInAUseCase(): never {
    throw ErrorStructureException.of(ServerError.of('the database password is hunter2'));
  }

  @Public()
  @Post('test/validated')
  acceptAThing(@Body() _thing: ThingRequest): void {}
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

    it("has the error's own code when a use case returns one", async () => {
      const response = await fetch(`${testApp.baseUrl}/test/missing-thing`);

      await expectErrorResponse(response, 404, [
        {
          code: 'THING_NOT_FOUND',
          title: 'thing_not_found_title',
          detail: 'thing_not_found_details',
        },
      ]);
    });

    it('says nothing of what failed when a use case returns a server error', async () => {
      const response = await fetch(`${testApp.baseUrl}/test/use-case-failure`);

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

    it('names each field a request got wrong, one error each', async () => {
      const response = await fetch(`${testApp.baseUrl}/test/validated`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ count: 'many', colour: 'red' }),
      });

      // In any order: a form shows each beside its own field.
      expect(response.status).toBe(400);
      const { errors } = (await response.json()) as { errors: unknown[] };
      expect(errors).toHaveLength(3);
      expect(errors).toEqual(
        expect.arrayContaining([notValid('name'), notValid('count'), notValid('colour')]),
      );
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
