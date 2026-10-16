import { Either } from 'effect';

// Why a latitude and a longitude were not taken as a map location.
export type MapLocationRefusal = 'outsideIraq';

// A box around Iraq, in degrees: the smallest in tenths of a degree that
// holds both OpenStreetMap's boundary of Iraq, waters included, and Natural
// Earth's 1:10m outline of its land. Every place in Iraq has a longitude
// greater than any Iraqi latitude, so coordinates typed the wrong way round
// always fall outside it, as long as its north edge stays below its west
// edge.
const aroundIraq = { south: 29.0, north: 37.4, west: 38.7, east: 49.2 };

// Where a Vendor is, as a latitude and a longitude in degrees.
export class MapLocation {
  private constructor(
    private readonly latitude: number,
    private readonly longitude: number,
  ) {}

  // A map location, refused when it is not inside the box around Iraq.
  static of(
    latitude: number,
    longitude: number,
  ): Either.Either<MapLocation, MapLocationRefusal> {
    const inIraq =
      latitude >= aroundIraq.south &&
      latitude <= aroundIraq.north &&
      longitude >= aroundIraq.west &&
      longitude <= aroundIraq.east;
    if (!inIraq) return Either.left('outsideIraq');

    return Either.right(new MapLocation(latitude, longitude));
  }

  getLatitude(): number {
    return this.latitude;
  }

  getLongitude(): number {
    return this.longitude;
  }
}
