import { describe, expect, it } from '@jest/globals';

import { askedAgainIfItDrops } from '../asked-again.ts';

// What fetch rejects with when the server drops the connection as the read
// goes out on it.
function dropped(): TypeError {
  return new TypeError('fetch failed', {
    cause: Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }),
  });
}

// A read whose connection drops `drops` times before it answers `status`,
// and how often it was asked.
function aRead(drops: number, status = 200) {
  let asked = 0;
  return {
    read: async (): Promise<Response> => {
      asked += 1;
      if (asked <= drops) throw dropped();
      return new Response(null, { status });
    },
    asked: () => asked,
  };
}

// A wait that returns at once, and what it was asked to wait.
function aWait() {
  const waited: number[] = [];
  return {
    wait: async (ms: number) => {
      waited.push(ms);
    },
    waited,
  };
}

describe('a read asked again if its connection drops', () => {
  it('is asked once when it answers, whatever the answer says', async () => {
    const { read, asked } = aRead(0, 500);
    const { wait, waited } = aWait();

    const answer = await askedAgainIfItDrops(read, wait);

    expect(answer.status).toBe(500);
    expect(asked()).toBe(1);
    expect(waited).toEqual([]);
  });

  it('is asked again when its connection drops, 300 and then 600 milliseconds after', async () => {
    const { read, asked } = aRead(2);
    const { wait, waited } = aWait();

    const answer = await askedAgainIfItDrops(read, wait);

    expect(answer.status).toBe(200);
    expect(asked()).toBe(3);
    expect(waited).toEqual([300, 600]);
  });

  it('gives up when its connection drops a third time, with what fetch said', async () => {
    const { read, asked } = aRead(3);
    const { wait, waited } = aWait();

    await expect(askedAgainIfItDrops(read, wait)).rejects.toThrow('fetch failed');
    expect(asked()).toBe(3);
    expect(waited).toEqual([300, 600]);
  });
});
