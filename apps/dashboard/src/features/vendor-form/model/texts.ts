// The words of a Vendor's form that differ between a new Vendor and the
// Admin's edit of one, in the Admin console's English.
export interface VendorFormTexts {
  // The title of a refusal that names no detail of the form.
  notSaved: string;
  // What the form says below the login phone number.
  loginPhoneNumber: string;
  // Why the Vendor was not saved, when the API cannot be reached.
  unreachable: string;
  // Why the Vendor was not saved, when Keycloak cannot be reached.
  identityServiceUnavailable: string;
}

export const vendorFormTexts: Record<'create' | 'edit', VendorFormTexts> = {
  create: {
    notSaved: 'The Vendor was not created.',
    loginPhoneNumber:
      'A mobile number. The Vendor logs in with it, and its login details are handed over to it on WhatsApp.',
    unreachable:
      'The API cannot be reached. Check the connection, and create the Vendor again.',
    identityServiceUnavailable:
      'The login service cannot be reached, so neither the Vendor nor its Login was made. Create the Vendor again in a moment.',
  },
  edit: {
    notSaved: 'The Vendor was not saved.',
    loginPhoneNumber:
      'A mobile number. The Vendor logs in with it. A new number changes what the Vendor logs in with, and its password stays.',
    unreachable:
      'The API cannot be reached. Check the connection, and save the Vendor again.',
    identityServiceUnavailable:
      'The login service cannot be reached, so neither the Vendor nor its Login was changed. Save the Vendor again in a moment.',
  },
};
