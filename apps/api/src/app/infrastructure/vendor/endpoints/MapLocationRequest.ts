import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, ValidateIf } from 'class-validator';

// A map location as it is sent: a latitude and a longitude, in degrees.
export class MapLocationRequest {
  @ApiProperty({
    description: 'The latitude, in degrees.',
    example: 36.1911744,
    type: Number,
  })
  @ValidateIf((_request, value) => value != null)
  @IsNumber()
  readonly latitude: number | null = null;

  @ApiProperty({
    description: 'The longitude, in degrees.',
    example: 44.0094145,
    type: Number,
  })
  @ValidateIf((_request, value) => value != null)
  @IsNumber()
  readonly longitude: number | null = null;
}
