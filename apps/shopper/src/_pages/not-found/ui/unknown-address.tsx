import { notFound } from 'next/navigation';

// The page behind every address that matches no other page. It asks for the
// "not found" screen. Without it Next would answer such an address itself,
// with a screen of its own, in English and outside the frame.
export function UnknownAddress(): never {
  notFound();
}
