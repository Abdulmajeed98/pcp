import { addressWithARefusal, identifierIn, refusalIn } from '@/shared/lib';

// Why "send on WhatsApp" was refused (DESIGN.md's Send on WhatsApp, the
// sharing spec's The Shopper app): the Vendor can no longer be reached
// through the platform, deactivated or without a WhatsApp number since the
// page was drawn (`notReachable`); or the API did not answer, so no chat
// could be opened (`notOpened`). A Build with nothing to share, or one the
// API refuses, is refused as a share is, since a send from the Build page
// shares it first.
export type SendRefusal = 'notReachable' | 'notOpened';

const sendRefusals: readonly SendRefusal[] = ['notReachable', 'notOpened'];

// A send refused, as a page reads it from its address: why, and the Vendor
// it was sent to, when the address names one.
export interface SendRefused {
  refused: SendRefusal;
  vendor: string | undefined;
}

// The Vendor a form or an address names by its identifier, or none.
function vendorNamedBy(sent: string | null | undefined): string | undefined {
  return sent === null || sent === undefined ? undefined : identifierIn(sent);
}

// The anchor of a Vendor's line in the second price view, where a send to it
// refused is said: `vendor-<identifier>`.
export function vendorLineAnchor(vendorId: string): string {
  return `vendor-${vendorId}`;
}

// The address a refused send is answered with, 303, in the new tab the form
// opened: the page the form was sent from, its address as the page writes
// it, with the reason and the Vendor in its query, opened at the Vendor's
// line, so that the page says it there, with script and without, and no
// chat is opened. A Vendor the form named by anything but an identifier,
// which only a form sent by hand does, is not written into the address, and
// the page opens at its Vendors.
export function addressAfterARefusedSend(
  page: string,
  refused: SendRefusal,
  vendor: string | undefined,
): string {
  const named = vendorNamedBy(vendor);
  if (named === undefined) return addressWithARefusal(page, { refused }, 'vendors');
  return addressWithARefusal(page, { refused, vendor: named }, vendorLineAnchor(named));
}

// Why a send was refused, and to which Vendor, as a page reads it from its
// address, or nothing: a reason it does not know, as a share's, a copy's or
// a change's refusal or an address changed by hand, says nothing of a send,
// and a Vendor that is no identifier is read as none.
export function refusedSendIn(query: {
  get(name: string): string | null;
}): SendRefused | undefined {
  const refused = refusalIn(query, sendRefusals);
  if (refused === undefined) return undefined;
  return { refused, vendor: vendorNamedBy(query.get('vendor')) };
}
