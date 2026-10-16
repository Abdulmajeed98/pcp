import { randomInt } from 'node:crypto';

// Lower-case letters and digits, without those that look alike: 0, o, 1, l
// and i. A Vendor types the password on a phone, without the shift key.
const characters = 'abcdefghjkmnpqrstuvwxyz23456789';

const length = 12;

// A temporary password for a Login, from a cryptographically secure
// generator. `randomInt` picks each character evenly from the set.
export function makeTemporaryPassword(): string {
  return Array.from({ length }, () => characters[randomInt(characters.length)]).join('');
}
