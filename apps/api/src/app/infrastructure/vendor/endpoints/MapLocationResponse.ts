import { ApiProperty } from '@nestjs/swagger';

import { MapLocation } from '~/domain/vendor/MapLocation';

// Where a Vendor's shop is, in degrees, which a frontend opens in Google Maps.
export class MapLocationResponse {
  @ApiProperty({ description: 'The latitude, in degrees.', example: 36.1911744 })
  readonly latitude: number;

  @ApiProperty({ description: 'The longitude, in degrees.', example: 44.0094145 })
  readonly longitude: number;

  private constructor(mapLocation: MapLocation) {
    this.latitude = mapLocation.getLatitude();
    this.longitude = mapLocation.getLongitude();
  }

  static of(mapLocation: MapLocation): MapLocationResponse {
    return new MapLocationResponse(mapLocation);
  }
}
