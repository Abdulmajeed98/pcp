import { createServer } from 'node:http';

import { answerFromTheStandIn } from './stand-in-api.ts';
import type { ShoppersShop } from './the-shoppers-shop.ts';

// The stand-in API over HTTP, on this machine alone, answering every request
// from the made-up shop (`stand-in-api.ts`) and saying each one it refused.
export interface StandIn {
  url: string;
  close(): Promise<void>;
}

export function startTheStandIn(
  shop: ShoppersShop,
  port: number,
  log: (line: string) => void,
): Promise<StandIn> {
  const server = createServer((request, response) => {
    const call = { method: request.method ?? 'GET', path: request.url ?? '/' };
    const answer = answerFromTheStandIn(shop, call);
    if (answer.refused !== undefined) {
      log(`The stand-in API refused ${call.method} ${call.path}: ${answer.refused}.`);
    }
    response.writeHead(answer.status, answer.headers);
    response.end(Buffer.isBuffer(answer.body) ? answer.body : JSON.stringify(answer.body));
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((closed) => {
            server.closeAllConnections();
            server.close(() => closed());
          }),
      });
    });
  });
}
