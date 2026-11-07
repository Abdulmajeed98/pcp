// The Shopper app's settings, read from its environment on the server. Each
// has the development value as its default, so the app starts with no
// environment file. None of them is named with `NEXT_PUBLIC_`, so Next never
// sends one to the browser.
export interface Settings {
  // `API_URL`: the API's address, as the server reaches it.
  apiUrl: string;
  // `SHOPPER_PUBLIC_URL`: the Shopper app's own public address, its origin
  // with no path, from which a page's canonical address, its addresses in
  // the other languages and a preview's image are written.
  publicAddress: string;
}

const defaults = {
  API_URL: 'http://localhost:3001',
  SHOPPER_PUBLIC_URL: 'http://localhost:3000',
} as const;

type Name = keyof typeof defaults;

// A setting whose value the Shopper app cannot use. Its message names it.
export class MalformedSetting extends Error {}

// A setting's value, or its default when it is not set or set to nothing.
function valueOf(environment: Readonly<Record<string, string | undefined>>, name: Name) {
  const value = environment[name]?.trim();
  return value === undefined || value === '' ? defaults[name] : value;
}

// An address on the web, over HTTP or HTTPS, or nothing.
function webAddress(text: string): URL | undefined {
  if (!URL.canParse(text)) return undefined;
  const address = new URL(text);
  return ['http:', 'https:'].includes(address.protocol) ? address : undefined;
}

// Reads the settings from an environment, such as `process.env`, and checks
// each one. A malformed one is refused with a message that names it and says
// what it must be.
export function settingsOf(
  environment: Readonly<Record<string, string | undefined>>,
): Settings {
  const apiUrl = valueOf(environment, 'API_URL');
  if (webAddress(apiUrl) === undefined) {
    throw new MalformedSetting(
      `API_URL must be the API's address over HTTP or HTTPS, such as ${defaults.API_URL}, and is "${apiUrl}".`,
    );
  }

  const publicUrl = valueOf(environment, 'SHOPPER_PUBLIC_URL');
  const publicAddress = webAddress(publicUrl);
  if (
    publicAddress === undefined ||
    publicAddress.pathname !== '/' ||
    publicAddress.search !== '' ||
    publicAddress.hash !== '' ||
    publicAddress.username !== '' ||
    publicAddress.password !== ''
  ) {
    throw new MalformedSetting(
      `SHOPPER_PUBLIC_URL must be the Shopper app's own address over HTTP or HTTPS, with no path, such as ${defaults.SHOPPER_PUBLIC_URL}, and is "${publicUrl}".`,
    );
  }

  return { apiUrl, publicAddress: publicAddress.origin };
}
