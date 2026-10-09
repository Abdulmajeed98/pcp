import { bearerHeader } from '@pcp/core/test-utils';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';

describe('the caller endpoint', () => {
  let testApp: TestAppWithLogins;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('answers an Admin with its identifier, its name and its one platform role', async () => {
    const token = await testApp.tokenOf({
      subject: '0b6f1c1e-6f0a-4c59-9d0a-3c1f6d2a7b10',
      loginName: 'an-admin',
      roles: ['admin'],
    });

    const response = await fetch(`${testApp.baseUrl}/v1/caller`, {
      headers: bearerHeader(token),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: '0b6f1c1e-6f0a-4c59-9d0a-3c1f6d2a7b10',
      loginName: 'an-admin',
      roles: ['admin'],
    });
  });

  it('answers a Vendor in the same way', async () => {
    const token = await testApp.tokenOf({
      subject: '7a1d9c52-3b7e-4e0f-8a46-d1c0b5e9f233',
      loginName: '07501234567',
      roles: ['vendor'],
    });

    const response = await fetch(`${testApp.baseUrl}/v1/caller`, {
      headers: bearerHeader(token),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: '7a1d9c52-3b7e-4e0f-8a46-d1c0b5e9f233',
      loginName: '07501234567',
      roles: ['vendor'],
    });
  });
});
