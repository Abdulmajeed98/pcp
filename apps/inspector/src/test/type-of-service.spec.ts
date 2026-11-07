import { Socket } from 'node:net';
import { constants } from 'node:os';

import { describe, expect, it } from '@jest/globals';

import { ignoreARefusedTypeOfService } from '../type-of-service.ts';

// Whether a release of undici ignores a refused type of service itself:
// 7.30.2 and later in 7, and 8.8.0 and later (nodejs/undici#5547). Only the
// line that says when the patch can go asks it.
function undiciIgnoresARefusedTypeOfService(version: string): boolean {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
  if (major === 7) return minor > 30 || (minor === 30 && patch >= 2);
  if (major === 8) return minor >= 8;
  return major > 8;
}

// A socket whose system refuses its type of service, as macOS refuses it on a
// connection reset as it opens: its handle answers EINVAL, and Node's own
// `setTypeOfService` throws that.
function aSocketWhoseSystemRefuses<T extends Socket>(socket: T): T {
  return Object.assign(socket, {
    _handle: { setTypeOfService: () => -constants.errno.EINVAL },
  });
}

describe("a socket's type of service, which Node's fetch sets on every new connection", () => {
  it("throws when the system refuses it, as Node's own socket does", () => {
    expect(() => aSocketWhoseSystemRefuses(new Socket()).setTypeOfService(0)).toThrow(
      'setTypeOfService EINVAL',
    );
  });

  it('is set at best effort once the inspect commands ignore a refusal, and the socket goes on', () => {
    class AnInspectorsSocket extends Socket {}
    ignoreARefusedTypeOfService(AnInspectorsSocket.prototype);
    const socket = aSocketWhoseSystemRefuses(new AnInspectorsSocket());

    expect(socket.setTypeOfService(0)).toBe(socket);
  });
});

describe('the releases of undici that ignore a refused type of service themselves', () => {
  it('are 7.30.2 and later in 7, and 8.8.0 and later', () => {
    const releases = [
      '7.29.1',
      '7.30.1',
      '7.30.2',
      '7.31.0',
      '8.7.2',
      '8.8.0',
      '8.12.2',
      '9.0.0',
    ];

    expect(
      releases.filter((release) => undiciIgnoresARefusedTypeOfService(release)),
    ).toEqual(['7.30.2', '7.31.0', '8.8.0', '8.12.2', '9.0.0']);
  });

  it("do not yet hold Node's own undici; once they do, remove ignoreARefusedTypeOfService and this line", () => {
    const nodesOwn = process.versions.undici;

    expect(nodesOwn).toMatch(/^\d+\.\d+\.\d+$/);
    expect(undiciIgnoresARefusedTypeOfService(nodesOwn ?? '')).toBe(false);
  });
});
