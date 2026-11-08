import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

// A switch a Shopper's request turns on, from the address's query: `true` to
// turn it on, `false` or left out to leave it off, and refused, naming its
// parameter, for any other text and for one given twice. The description
// says what it does when it is on.
export function SwitchAsked(description: string): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({ description, type: 'boolean', default: false }),
    IsOptional(),
    IsIn(['true', 'false']),
  );
}

// Whether a switch `SwitchAsked` let through is on.
export function isOn(asked: string | undefined): boolean {
  return asked === 'true';
}
