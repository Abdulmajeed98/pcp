import { buildMessage, registerDecorator, ValidationOptions } from 'class-validator';

import { isOrigin } from './cors';

// Marks a setting as an origin. With `each`, every entry of a list is one.
export function IsOrigin(validationOptions?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isOrigin',
      target: target.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      validator: {
        validate: isOrigin,
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be an origin, such as http://localhost:3002`,
          validationOptions,
        ),
      },
    });
  };
}
