// The longest a detail of a Vendor written as text may be, in characters, as
// the API checks it, for both forms of a Vendor's details to say. The API's
// description states the name's, the address's and the opening hours'. An
// Instagram name's is Instagram's own, and is counted once an @ or a
// profile's address is taken off it.
export const longest = {
  name: 100,
  address: 300,
  openingHours: 300,
  instagramName: 30,
} as const;
