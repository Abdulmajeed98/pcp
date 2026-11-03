// The address of Google Maps' search for a Vendor's coordinates, which is
// Google's documented way to link to a place: on a phone with Google Maps it
// opens the app, and elsewhere Google Maps in the browser. Its query is the
// latitude and the longitude with a comma between them, which the address
// writes as %2C (Maps URLs, "Search action").
export function googleMapsSearchFor({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): string {
  const query = new URLSearchParams({ api: '1', query: `${latitude},${longitude}` });
  return `https://www.google.com/maps/search/?${query}`;
}
