import { Socket } from 'node:net';

// A socket's type of service, which Node's fetch sets on every new
// connection, set at best effort in both inspect commands. On macOS the
// system refuses it, EINVAL, on a connection reset as it opens, and Node
// 24.21.0's fetch (undici 7.29.1) throws that refusal from the socket's own
// event, where no promise holds it, so the command stops (browse's code
// review). undici 7.30.2 and 8.8.0 ignore the refusal themselves
// (nodejs/undici#5547); until Node bundles one of them, the commands ignore
// it here, as follow-up ticket 01 records. A type of service only asks the
// networks between for a priority, and the commands ask servers on this
// computer alone.
//
// Remove it once Node's own undici ignores the refusal: the unit test of it
// fails then, to say so.
export function ignoreARefusedTypeOfService(prototype: Socket = Socket.prototype): void {
  const setTypeOfService = prototype.setTypeOfService;
  prototype.setTypeOfService = function (this: Socket, tos: number) {
    try {
      return setTypeOfService.call(this, tos);
    } catch {
      return this;
    }
  };
}

// Whether a release of undici ignores a refused type of service itself:
// 7.30.2 and later in 7, and 8.8.0 and later.
export function undiciIgnoresARefusedTypeOfService(version: string): boolean {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
  if (major === 7) return minor > 30 || (minor === 30 && patch >= 2);
  if (major === 8) return minor >= 8;
  return major > 8;
}
