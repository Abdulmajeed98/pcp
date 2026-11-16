import { NotValidError } from '@pcp/core';

// A Referral to a Vendor that gave no WhatsApp number, refused naming
// `vendorId`, since no chat can be opened with it.
export function noWhatsAppNumberRefused(): NotValidError {
  return NotValidError.of(
    'NOT_VALID',
    'A Referral names a Vendor with no WhatsApp number',
    { field: 'vendorId', reason: 'noWhatsAppNumber' },
  );
}
