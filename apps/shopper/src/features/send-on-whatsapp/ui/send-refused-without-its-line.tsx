import { getTranslations } from 'next-intl/server';

import { type SendRefused, vendorLineAnchor } from '../model/refused-send';
import { SendRefusedSaid } from './send-on-whatsapp';

// A send refused where its Vendor's line is not, as for a Vendor deactivated
// since the page was drawn, whose line has gone and whose name the page no
// longer has (DESIGN.md's Send on WhatsApp, the owner's answer of 17
// November 2026): said without the name, "The Vendor you chose can no
// longer be reached through the platform.", or that WhatsApp could not be
// opened, at the head of the Vendors' sheet, or under the slip's action on
// a page left with no Vendors' sheet, carrying the anchor of the Vendor's
// line, where the address opens the page.
export async function SendRefusedWithoutItsLine({ refused }: { refused: SendRefused }) {
  const t = await getTranslations('BuildPage.send.refused');
  return (
    <SendRefusedSaid
      id={refused.vendor === undefined ? undefined : vendorLineAnchor(refused.vendor)}
      words={refused.refused === 'notReachable' ? t('notReachableUnnamed') : t('notOpened')}
    />
  );
}
