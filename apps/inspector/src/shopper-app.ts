import { type ChildProcess, spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { connect } from 'node:net';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

// The Shopper app of the inspection: Next's development server for
// `apps/shopper`, on a port of its own, with `API_URL` set to the stand-in
// API. Next lets one development server work in a folder's files at a time,
// so this one keeps its files in a folder of its own,
// `apps/shopper/tmp/inspection`, which Git ignores, and the owner's own
// Shopper app on port 3000 is left alone. `next.config.js` reads that folder
// from `SHOPPER_INSPECTION_DIST_DIR`, which only this command sets.

const shopperFolder = fileURLToPath(new URL('../../shopper/', import.meta.url));
export const shoppersOwnFiles = 'tmp/inspection';

// Whether something answers at a port of this machine, on either address of
// `localhost`.
export async function isTaken(port: number): Promise<boolean> {
  const answers = (host: string) =>
    new Promise<boolean>((resolve) => {
      const socket = connect({ port, host });
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => resolve(false));
    });
  return (await answers('127.0.0.1')) || (await answers('::1'));
}

export interface ShopperApp {
  // Stops the server and every process it started, at once.
  stop(): void;
  // Whether it stopped of itself, and what its last lines said.
  exited(): boolean;
  lastLines(): string;
}

export function startTheShopperApp({
  port,
  apiUrl,
}: {
  port: number;
  apiUrl: string;
}): ShopperApp {
  const next = createRequire(join(shopperFolder, 'package.json')).resolve(
    'next/dist/bin/next',
  );
  const files = join(shopperFolder, shoppersOwnFiles);
  mkdirSync(files, { recursive: true });
  const log = createWriteStream(join(files, 'next-dev.log'));
  let last = '';
  // A process group of its own, so that it and every process Next starts
  // are stopped together, and Ctrl-C in the terminal reaches this command
  // alone, which stops it.
  const server: ChildProcess = spawn(
    process.execPath,
    [next, 'dev', '--port', String(port)],
    {
      cwd: shopperFolder,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        API_URL: apiUrl,
        // Its pages' previews name their addresses on this port, the one the
        // inspector opens them at.
        SHOPPER_PUBLIC_URL: `http://localhost:${port}`,
        SHOPPER_INSPECTION_DIST_DIR: shoppersOwnFiles,
        NEXT_TELEMETRY_DISABLED: '1',
      },
    },
  );
  const keep = (chunk: Buffer) => {
    log.write(chunk);
    last = (last + chunk.toString()).split('\n').slice(-12).join('\n');
  };
  server.stdout?.on('data', keep);
  server.stderr?.on('data', keep);
  let stopped = false;
  return {
    stop() {
      if (stopped || server.pid === undefined) return;
      stopped = true;
      try {
        process.kill(-server.pid, 'SIGTERM');
      } catch {
        // It had already stopped.
      }
    },
    exited: () => server.exitCode !== null || server.signalCode !== null,
    lastLines: () => last,
  };
}

// Waits until the Shopper app answers the address, which also makes Next
// compile the page before the inspector opens it, at most `timeoutMs`. Any
// answer counts, a not-found page among them, since that is a page too.
export async function untilItAnswers(
  app: ShopperApp,
  address: string,
  timeoutMs: number,
): Promise<boolean> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end && !app.exited()) {
    const answered = await fetch(address, { redirect: 'manual' })
      .then(() => true)
      .catch(() => false);
    if (answered) return true;
    await sleep(500);
  }
  return false;
}
