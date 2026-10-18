import type { MapLocationResponse } from '@pcp/api-client';

// The address of Google Maps' search for a Vendor's coordinates, which is
// Google's documented way to link to a place: on a phone with Google Maps it
// opens the app, and elsewhere Google Maps in the browser. Its query is the
// latitude and the longitude with a comma between them, which the address
// writes as %2C (Maps URLs, "Search action").
export function googleMapsSearchFor({ latitude, longitude }: MapLocationResponse): string {
  const query = new URLSearchParams({ api: '1', query: `${latitude},${longitude}` });
  return `https://www.google.com/maps/search/?${query}`;
}

// The coordinates as Google Maps shows a place's, in degrees, the latitude
// first: "36.1911744, 44.0094145". They are English in every language.
export function coordinatesOf({ latitude, longitude }: MapLocationResponse): string {
  return `${latitude}, ${longitude}`;
}

// Arabic-Indic and Eastern Arabic-Indic digits, and the Arabic decimal
// separator and comma, which a Kurdish or an Arabic keyboard types, as the
// Western digits, point and comma Google Maps writes.
const asWritten: Record<string, string> = { '٫': '.', '،': ',' };
for (let digit = 0; digit <= 9; digit++) {
  asWritten[String.fromCharCode(0x0660 + digit)] = String(digit);
  asWritten[String.fromCharCode(0x06f0 + digit)] = String(digit);
}

// Two numbers in decimal degrees, the latitude first, with a comma between
// them and any spaces around it, as Google Maps shows and copies a place's
// coordinates: "36.1911744, 44.0094145" (Google Maps Help, "Search by
// latitude & longitude in Google Maps").
const decimalDegrees = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

// The map location written in a field: null when nothing is, a latitude and
// a longitude when two numbers are written as Google Maps writes them, and
// undefined when the text is not coordinates. Whether they are in Iraq is
// the API's to say.
export function mapLocationIn(text: string): MapLocationResponse | null | undefined {
  const western = text.replace(
    /[٠-٩۰-۹٫،]/g,
    (character) => asWritten[character] ?? character,
  );
  if (western.trim() === '') return null;

  const written = decimalDegrees.exec(western);
  if (written === null) return undefined;
  return { latitude: Number(written[1]), longitude: Number(written[2]) };
}
