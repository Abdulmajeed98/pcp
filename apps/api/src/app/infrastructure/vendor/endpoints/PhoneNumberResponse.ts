import { ApiProperty } from '@nestjs/swagger';

import { PhoneNumber } from '~/domain/phone-number/PhoneNumber';

// A phone number in the two forms a frontend needs, so that no frontend reads
// phone numbers itself.
export class PhoneNumberResponse {
  @ApiProperty({
    description: 'The form it is stored in, international and with no spaces, for links.',
    example: '+9647501234567',
  })
  readonly international: string;

  @ApiProperty({
    description: "Iraq's own form, which a person reads.",
    example: '0750 123 4567',
  })
  readonly national: string;

  private constructor(phoneNumber: PhoneNumber) {
    this.international = phoneNumber.getInternational();
    this.national = phoneNumber.getNational();
  }

  static of(phoneNumber: PhoneNumber): PhoneNumberResponse {
    return new PhoneNumberResponse(phoneNumber);
  }
}
