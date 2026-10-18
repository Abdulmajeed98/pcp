import type { PhoneNumberResponse } from '@pcp/api-client';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import type { ReactNode } from 'react';

// The pieces a screen that shows a Vendor's details is made of: the Admin
// console's Vendor page, in English, and the Vendor portal's details screen,
// in the portal's language. Each piece that says something is given its
// words by the screen.

// A list of a Vendor's details, a row each, divided and closed above and
// below by Rule Sand rules.
export function DetailList({ children }: { children: ReactNode }) {
  return (
    <dl className="divide-y divide-border border-y border-border text-sm">{children}</dl>
  );
}

// One detail of the Vendor, under its name, found by the name the API gives
// it. On a phone 360 pixels wide the name and the value share the row.
export function Detail({
  name,
  label,
  children,
}: {
  name: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      data-detail={name}
      className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-1 py-2.5"
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// Text the Vendor wrote on one or more lines, kept on its lines, and laid
// out in its own direction, so that a Kurdish address is aligned right on an
// English page (LANG-4).
export function WrittenOnLines({ text }: { text: string }) {
  return <AsWritten className="block whitespace-pre-line">{text}</AsWritten>;
}

// A phone number in Iraq's own form, which is English in every language
// (LANG-5), or `none` when the Vendor has none.
export function PhoneNumberShown({
  number,
  none,
}: {
  number: PhoneNumberResponse | null;
  none: ReactNode;
}) {
  return number === null ? none : <AlwaysEnglish>{number.national}</AlwaysEnglish>;
}
