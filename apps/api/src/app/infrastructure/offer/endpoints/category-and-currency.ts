import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { currencies } from '~/domain/currency/currency';
import { Category } from '~/domain/part/Category';

// What a Shopper's request asks a Category's list or its filters of: the
// Category, by its key, required, so that no page can forget to send it, and
// refused, naming `category`, when it is none of the eight. The description
// says what the Category is to the endpoint.
export function CategoryAsked(description: string): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ description, enum: Category.keys(), example: 'cpu' }),
    IsIn(Category.keys()),
  );
}

// The Category a request asked by its key, which `CategoryAsked` lets
// through only when it is one of the eight.
export function theCategoryAsked(key: string): Category {
  return Category.withKey(key) as Category;
}

// The chosen currency a Shopper's request asks its prices in, required, so
// that no page can forget to send the Shopper's choice, and refused, naming
// `currency`, when it is neither USD nor IQD. The description says what the
// currency is to the endpoint.
export function ChosenCurrencyAsked(description: string): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description,
      enum: currencies,
      // Named, so that the generated client gives the frontends one `Currency`.
      enumName: 'Currency',
      example: 'IQD',
    }),
    IsIn(currencies),
  );
}
