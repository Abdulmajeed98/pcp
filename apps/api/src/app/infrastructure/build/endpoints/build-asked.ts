import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { asAList } from '~/infrastructure/offer/endpoints/as-a-list';

// The Build a Shopper's request gives, in its repeated `part`, declared once
// for every request that takes a Build. Each value is a Part's identifier,
// followed for a RAM kit or a drive by `:` and its quantity. How each value
// is read, and why one is refused, the domain decides (`BuildReading`). The
// description says what the Build is to the endpoint, and what it reads when
// `part` is left out.
export function BuildAsked(description: string): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      description: `${description} Each value is a Part's identifier, followed for a RAM kit or a drive by \`:\` and its quantity, a whole number from 1 to 16 in Western digits, repeated for each Part. A Part the catalog does not hold is left out of the Build. Refused, naming \`part\`, for a value that is not an identifier; a quantity on a Part that is not a RAM kit or a drive, or none on one that is; a quantity outside 1 to 16; two Parts of a Category a Build holds one of; one Part given twice; and more than 8 different RAM kits, or more than 8 different drives.`,
      type: [String],
      example: [
        '3b8f0c52-6a1e-4f3d-9c27-5e8a1d4b7f60',
        '9d2b6c1e-0f3a-4b7d-8e5c-1a2b3c4d5e6f:2',
      ],
    }),
    IsOptional(),
    Transform(asAList),
    IsString({ each: true }),
  );
}
