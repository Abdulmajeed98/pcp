import type { MapLocationResponse } from '@pcp/api-client';
import { westernDigitsIn } from '@pcp/i18n';

// The coordinates as Google Maps shows a place's, in degrees, the latitude
// first: "36.1911744, 44.0094145". They are English in every language.
export function coordinatesOf({ latitude, longitude }: MapLocationResponse): string {
  return `${latitude}, ${longitude}`;
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
  // The digits and the decimal separator a Kurdish or an Arabic keyboard
  // types, and its comma, as the Western ones Google Maps writes.
  const western = westernDigitsIn(text).replace(/،/g, ',');
  if (western.trim() === '') return null;

  const written = decimalDegrees.exec(western);
  if (written === null) return undefined;
  return { latitude: Number(written[1]), longitude: Number(written[2]) };
}
