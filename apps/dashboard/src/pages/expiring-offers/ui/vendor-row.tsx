import type { VendorWithExpiringOffersResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import {
  CircleAlertIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  PhoneIcon,
} from 'lucide-react';
import { Link } from 'react-router';

import { whatsAppChatWith } from '@/shared/lib';
import { Item, ItemContent, ItemTitle } from '@/shared/ui';

import { callTo } from '../model/links';

// A link that is a row's own action, drawn above the link that covers the
// whole row, 44 pixels high.
const numberLink =
  'relative z-10 inline-flex min-h-control items-center gap-1.5 underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2';

// Why the Vendor is on the list, in plain words: how many of its Offers have
// expired and how many are about to, leaving out a count of none.
function whyToRemind({ counts }: VendorWithExpiringOffersResponse): string {
  const reasons = [];
  if (counts.expired > 0) {
    reasons.push(
      `${formatNumber(counts.expired)} ${counts.expired === 1 ? 'Expired Offer' : 'Expired Offers'}`,
    );
  }
  if (counts.aboutToExpire > 0) {
    reasons.push(`${formatNumber(counts.aboutToExpire)} about to expire`);
  }
  return reasons.join(' · ');
}

// One Vendor to remind: its name as it writes it, then one line in Action Red
// after a circled exclamation mark that says why, and then its two numbers in
// Iraq's own form, which is English in every language, each a link of its
// own: the phone number calls it, and the WhatsApp number opens a chat with
// it from the Admin's own WhatsApp, in a new tab. A Vendor with no WhatsApp
// number says so. The whole row leads to the Vendor's page, while the link's
// name is the Vendor's alone. The owner chose this row on 20 October 2026
// over the numbers as outlined buttons.
export function VendorRow({ vendor }: { vendor: VendorWithExpiringOffersResponse }) {
  return (
    <Item className="relative rounded-none px-0 hover:bg-secondary">
      <ItemContent>
        <ItemTitle>
          <Link
            to={`/vendors/${vendor.id}`}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            <AsWritten>{vendor.name}</AsWritten>
          </Link>
        </ItemTitle>
        <p
          data-testid="why-to-remind"
          className="flex items-start gap-1.5 text-sm font-medium text-destructive"
        >
          <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{whyToRemind(vendor)}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-4 text-sm">
          <a
            href={callTo(vendor.phoneNumber.international)}
            data-testid="call"
            className={numberLink}
          >
            <PhoneIcon aria-hidden="true" className="size-4" />
            <span className="sr-only">Call </span>
            <AlwaysEnglish>{vendor.phoneNumber.national}</AlwaysEnglish>
          </a>
          {vendor.whatsAppNumber === null ? (
            <span className="inline-flex min-h-control items-center text-muted-foreground">
              No WhatsApp
            </span>
          ) : (
            <a
              href={whatsAppChatWith(vendor.whatsAppNumber.international)}
              target="_blank"
              rel="noreferrer"
              data-testid="chat"
              className={numberLink}
            >
              <MessageCircleIcon aria-hidden="true" className="size-4" />
              <span className="sr-only">Chat in WhatsApp with </span>
              <AlwaysEnglish>{vendor.whatsAppNumber.national}</AlwaysEnglish>
              <span className="sr-only">, in a new tab</span>
              <ExternalLinkIcon aria-hidden="true" className="size-4" />
            </a>
          )}
        </p>
      </ItemContent>
    </Item>
  );
}
