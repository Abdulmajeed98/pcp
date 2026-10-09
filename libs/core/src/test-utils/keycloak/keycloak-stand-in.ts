import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';

import { TestKey } from '../token/token-factory';

// Stands in for Keycloak in a test, over HTTP: it publishes a realm's
// discovery document and the keys the realm signs with, and nothing else.
export type KeycloakStandIn = {
  // The realm's issuer, which is also where the stand-in listens.
  issuer: string;
  // Publishes these keys in place of the ones published before.
  publish(...keys: TestKey[]): void;
  // How many times the keys have been fetched.
  keyRequests(): number;
  stop(): Promise<void>;
};

const realmPath = '/realms/pcp';
const keysPath = `${realmPath}/protocol/openid-connect/certs`;

export async function startKeycloakStandIn(): Promise<KeycloakStandIn> {
  let published: TestKey[] = [];
  let keyRequests = 0;
  let issuer = '';

  const server = createServer((request, response) => {
    const answer = (body: object) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    };

    if (request.url === `${realmPath}/.well-known/openid-configuration`) {
      answer({ issuer, jwks_uri: `http://${request.headers.host}${keysPath}` });
    } else if (request.url === keysPath) {
      keyRequests += 1;
      answer({ keys: published.map((key) => key.publicJwk) });
    } else {
      response.writeHead(404).end();
    }
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  issuer = `http://127.0.0.1:${port}${realmPath}`;

  return {
    issuer,
    publish: (...keys) => {
      published = keys;
    },
    keyRequests: () => keyRequests,
    stop: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        // A connection that is kept open would otherwise keep answering.
        server.closeAllConnections();
      }),
  };
}
