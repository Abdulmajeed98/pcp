// A read of the API, asked again, twice at most, 300 and then 600
// milliseconds after, when its connection drops: the API's server can close
// a kept-alive connection just as the next read goes out on it, and both
// commands ask the API many reads. Fetch then rejects ("fetch failed"),
// with ECONNRESET, or with `setTypeOfService EINVAL` where Node 24.21.0's
// fetch (undici 7.29.1) writes the read on a connection already reset, on
// macOS. An answer is never asked again, whatever it says, and only reads,
// which asking twice cannot change, are asked through it.
//
// No retry can catch that EINVAL when undici throws it from a socket's own
// event, as for a connection reset as it opens (browse's code review), where
// no promise holds it; both commands ignore it where it is thrown instead
// (`type-of-service.ts`), until Node holds undici's fix, nodejs/undici#5547.
export async function askedAgainIfItDrops(
  read: () => Promise<Response>,
  wait: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<Response> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await read();
    } catch (error) {
      if (attempt === 3) throw error;
      await wait(300 * attempt);
    }
  }
}
