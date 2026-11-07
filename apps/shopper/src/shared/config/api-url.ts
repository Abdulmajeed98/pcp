import { settingsOf } from './settings';

// The API's address, as the Shopper app's server reaches it. It is read on the
// server only: its name has no `NEXT_PUBLIC_` prefix, so Next never sends it
// to the browser. It is a function because it is read when a request is being
// answered, and not when the app is built.
export function apiUrl(): string {
  return settingsOf(process.env).apiUrl;
}
