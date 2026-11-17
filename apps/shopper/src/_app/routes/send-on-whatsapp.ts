import type { Language } from '@pcp/i18n';

import { buildAddress } from '@/entities/build';
import { sharedBuildAddress, sharedBuildLink } from '@/entities/shared-build';
import { addressAfterARefusedSend, chatWithTheVendor } from '@/features/send-on-whatsapp';
import { publicAddress } from '@/shared/config';

import { recordAReferral } from '../api/record-a-referral';
import { answerAForm, type FormAnswered } from './answer-a-form';
import { aRefusedShare, shareTheBrowsersBuild } from './share-and-copy';

// The Vendor a send names, its form's `vendor`, or none.
function vendorIn(form: FormData): string | undefined {
  const vendor = form.get('vendor');
  return typeof vendor === 'string' && vendor.length > 0 ? vendor : undefined;
}

// Records the Referral of a Shared Build to the Vendor, and answers the new
// tab the form opened: with WhatsApp's chat with the Vendor, at the number
// the Referral answered, its message in the form's language holding the
// Shared Build's link in that language, on the Shopper app's public address
// (DESIGN.md's The WhatsApp message); or, refused, with the page the form
// was sent from at the Vendor's line, saying why, and no chat. A Shared
// Build the API does not hold answers with that page, which is the
// not-found page.
async function referAndOpenTheChat(
  language: Language,
  { page, sharedBuildId, vendor }: { page: string; sharedBuildId: string; vendor: string },
): Promise<FormAnswered> {
  const recorded = await recordAReferral(sharedBuildId, vendor);
  switch (recorded.kind) {
    case 'referred':
      return {
        address: chatWithTheVendor(
          language,
          recorded.vendor,
          sharedBuildLink(publicAddress(), language, sharedBuildId),
        ),
      };
    case 'not-reachable':
      return { address: addressAfterARefusedSend(page, 'notReachable', vendor) };
    case 'no-shared-build':
      return { address: page };
    default:
      return { address: addressAfterARefusedSend(page, 'notOpened', vendor) };
  }
}

// `POST /<language>/build/send` with `vendor`, "send on WhatsApp" from the
// Build page (SHR-5, SHR-6): one tap shares the Build the browser's cookie
// holds, as the share form does (`shareTheBrowsersBuild`), which finds the
// Shared Build an earlier share of the same Build stored, then records a
// Referral of it to the Vendor and opens the Shopper's chat with the Vendor
// in the new tab the form opened (`target="_blank"`). The platform sends
// nothing itself: the Shopper sends the message from their own WhatsApp. A
// Build with nothing to share, or one the API refuses, comes back to the
// Build page as a share refused does; a Vendor the platform can no longer
// reach, and an API that does not answer, come back to the Build page at
// the Vendor's line, saying why. When the catalog no longer holds a Part,
// the cookie forgets it, as a share does.
export const sendTheBuild = answerAForm(async (language, form) => {
  const vendor = vendorIn(form);
  const page = buildAddress(language);
  if (vendor === undefined) {
    return { address: addressAfterARefusedSend(page, 'notReachable', vendor) };
  }

  const sharing = await shareTheBrowsersBuild();
  const refused = aRefusedShare(language, sharing);
  if (refused !== undefined) return refused;
  if (sharing.shared.kind !== 'shared') {
    return { address: addressAfterARefusedSend(page, 'notOpened', vendor) };
  }

  const answered = await referAndOpenTheChat(language, {
    page,
    sharedBuildId: sharing.shared.sharedBuildId,
    vendor,
  });
  return { ...answered, write: sharing.forget };
});

// `POST /<language>/builds/<sharedBuildId>/send` with `vendor`, "send on
// WhatsApp" from the Shared Build page (SHR-5, SHR-6): one tap records a
// Referral of this Shared Build to the Vendor and opens the Shopper's chat
// with the Vendor in the new tab the form opened, its message holding this
// Shared Build's link in the page's language. A refusal comes back to the
// Shared Build page at the Vendor's line, saying why.
export const sendTheSharedBuild = answerAForm<{ sharedBuildId: string }>(
  async (language, form, { sharedBuildId }) => {
    const vendor = vendorIn(form);
    const page = sharedBuildAddress(language, sharedBuildId);
    if (vendor === undefined) {
      return { address: addressAfterARefusedSend(page, 'notReachable', vendor) };
    }
    return referAndOpenTheChat(language, { page, sharedBuildId, vendor });
  },
);
