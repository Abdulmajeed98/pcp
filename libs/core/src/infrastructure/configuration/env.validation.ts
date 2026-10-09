import { plainToInstance } from 'class-transformer';
import {
  buildMessage,
  IsNotEmpty,
  IsString,
  IsUrl,
  registerDecorator,
  validateSync,
  ValidationOptions,
} from 'class-validator';

import { isOrigin } from '../security/cors';

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

// Checks the environment against an application's settings class and returns
// the settings, each in the type the class gives it. A setting the
// environment does not set keeps the default the class gives it. A malformed
// setting throws, with every one of them named, and the application does not
// start.
export function validateEnvironment<Settings extends object>(
  settingsClass: new () => Settings,
  config: Record<string, unknown>,
): Settings {
  const settings = plainToInstance(settingsClass, config);

  const errors = validateSync(settings, { skipMissingProperties: false });
  if (errors.length > 0) {
    const reasons = errors.flatMap((error) => Object.values(error.constraints ?? {}));
    throw new Error(`The settings are not valid: ${reasons.join('; ')}.`);
  }

  return settings;
}

// The settings `core` itself reads. An application's settings class extends
// this one.
export class CoreEnvironmentVariables {
  // The realm that issues the platform's logins. A token is accepted only
  // when it names exactly this as its issuer, and the realm's keys are
  // fetched from where its discovery document says they are.
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  KEYCLOAK_ISSUER = 'http://localhost:8080/realms/pcp';

  // The audience a token must name to be accepted by this API.
  @IsString()
  @IsNotEmpty()
  KEYCLOAK_AUDIENCE = 'pcp-api';
}
