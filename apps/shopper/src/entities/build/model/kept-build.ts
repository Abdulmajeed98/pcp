import type { NextResponse } from 'next/server';

import { rememberAChoice } from '@/shared/lib';

import { type Build, readTheBuild, writeTheBuild } from './build';

// The cookie the Shopper's Build is kept in, as the currency and the scheme
// are: the browser sends it with every request, and only the server reads and
// writes it, so that the Build page is drawn on the server and works before
// any script has loaded (BLD-6). It holds each Part's identifier under its
// Category and a kit's or a drive's quantity, and never a name, a price or a
// specification, which the API answers for each request.
export const buildCookie = 'build';

// What the Build is read from: the cookies of the request being answered,
// which the server hands in (`await cookies()` from `next/headers`). This
// slice imports nothing of the server's own, so that the forms that change
// the Build can use it in the browser too.
export interface RequestCookies {
  get(name: string): { value: string } | undefined;
}

// The Shopper's Build, read from the request's cookies: what can be read of
// its cookie, and an empty Build when there is none.
export function buildIn(cookies: RequestCookies): Build {
  return readTheBuild(cookies.get(buildCookie)?.value);
}

// Writes the Build into the server's answer, kept for a year through the
// function that keeps the currency and the scheme (`rememberAChoice`), or
// tells the browser to forget it once it is empty.
export function rememberTheBuild(response: NextResponse, build: Build): void {
  if (build.length === 0) {
    response.cookies.delete(buildCookie);
    return;
  }
  rememberAChoice(response, buildCookie, writeTheBuild(build));
}
