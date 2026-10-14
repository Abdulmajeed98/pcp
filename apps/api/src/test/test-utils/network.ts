import { createServer } from 'node:net';

// A port on this machine where nothing listens, so that a connection to it is
// refused at once, as one to a stopped service is.
export function aPortWhereNothingListens(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() =>
        typeof address === 'object' && address !== null
          ? resolve(address.port)
          : reject(new Error('No port was given')),
      );
    });
  });
}
