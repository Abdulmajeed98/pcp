import { settingsOf } from './settings';

// The Shopper app's own public address, its origin with no path, such as
// `http://localhost:3000` during development. A page's preview writes its
// canonical address and its addresses in the other languages from it, so
// that a search engine and a chat app are given the addresses a Shopper
// opens, whatever the server is known by behind it. It is read on the server
// when a request is answered, never when the app is built.
export function publicAddress(): string {
  return settingsOf(process.env).publicAddress;
}
