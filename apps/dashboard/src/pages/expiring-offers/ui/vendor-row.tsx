import type { VendorWithExpiringOffersResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import {
  CircleAlertIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  PhoneIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { type ShownRow, whatsAppChatWith, movingProps } from '@/shared/lib';
import {
  linkOverRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

import { callTo } from '../model/links';

// A Vendor to remind, as the dashboard's DESIGN.md lays it out (redesign
// ticket 10): its name as it writes it, why it is on the list, in Action Red
// after a circled exclamation mark, and its two numbers in Iraq's own form,
// which is English in every language, each a link of its own: the phone
// number calls it, and the WhatsApp number opens a chat with it from the
// Admin's own WhatsApp, in a new tab. A Vendor with no WhatsApp number says
// so. A table from 64rem and rows on a phone, never cards. The whole row
// leads to the Vendor's page, while the link's name is the Vendor's alone,
// and takes a Raised Stone ground under the pointer. The owner chose the
// numbers as underlined links on 20 October 2026, over outlined buttons.

// A link that is a row's own action, drawn above the link that covers the
// whole row, as high as a control.
const numberLink =
  'hover-colour relative z-10 inline-flex min-h-control items-center gap-1.5 underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2';

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

function VendorLink({ vendor }: { vendor: VendorWithExpiringOffersResponse }) {
  return (
    <Link to={`/vendors/${vendor.id}`} className={cn('font-[550]', linkOverRow)}>
      <AsWritten>{vendor.name}</AsWritten>
    </Link>
  );
}

function WhyToRemind({ vendor }: { vendor: VendorWithExpiringOffersResponse }) {
  return (
    <p className="flex items-start gap-1.5 font-medium text-destructive">
      <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span data-testid="why-to-remind">{whyToRemind(vendor)}</span>
    </p>
  );
}

function CallLink({ vendor }: { vendor: VendorWithExpiringOffersResponse }) {
  return (
    <a
      href={callTo(vendor.phoneNumber.international)}
      data-testid="call"
      className={numberLink}
    >
      <PhoneIcon aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">Call </span>
      <AlwaysEnglish>{vendor.phoneNumber.national}</AlwaysEnglish>
    </a>
  );
}

function ChatLink({ vendor }: { vendor: VendorWithExpiringOffersResponse }) {
  if (vendor.whatsAppNumber === null) {
    return (
      <span className="inline-flex min-h-control items-center text-muted-foreground">
        No WhatsApp
      </span>
    );
  }
  return (
    <a
      href={whatsAppChatWith(vendor.whatsAppNumber.international)}
      target="_blank"
      rel="noreferrer"
      data-testid="chat"
      className={numberLink}
    >
      <MessageCircleIcon aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">Chat in WhatsApp with </span>
      <AlwaysEnglish>{vendor.whatsAppNumber.national}</AlwaysEnglish>
      <span className="sr-only">, in a new tab</span>
      <ExternalLinkIcon aria-hidden="true" className="size-4 shrink-0" />
    </a>
  );
}

// On a phone: the Vendor's name, why it is on the list, and its two numbers
// on one line, which wraps when they do not fit.
export function VendorRow({ vendor }: { vendor: VendorWithExpiringOffersResponse }) {
  return (
    <div className="hover-colour relative flex flex-col gap-0.5 px-2 pt-3 pb-1 text-sm hover:bg-secondary">
      <span>
        <VendorLink vendor={vendor} />
      </span>
      <WhyToRemind vendor={vendor} />
      <p className="flex flex-wrap items-center gap-x-4">
        <CallLink vendor={vendor} />
        <ChatLink vendor={vendor} />
      </p>
    </div>
  );
}

// A table cell's content, at the row's top. A cell of words sets its first
// line level with the middle of the numbers' links, which are as high as a
// control, 6 pixels below the row's top: half a control less half a line of
// 20 pixels, under a mouse or a finger. A row of one line is then 48 pixels
// under a mouse (redesign ticket 10's break-ui). It holds the cell's padding
// inside the theme's `leaves`, so that a leaving row's space closes whole.
function Cell({ links = false, children }: { links?: boolean; children: ReactNode }) {
  return (
    <TableCell className="h-auto p-0 align-top">
      <div className="leaves">
        <div>
          <div
            className={cn(
              'px-2',
              links
                ? 'flex flex-col items-start py-1.5'
                : 'pt-[calc(var(--spacing-control)/2_-_0.25rem)] pb-3.5',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </TableCell>
  );
}

// From 64rem: a table of four columns, the Vendor given the most width, then
// why it is on the list, its phone number and its WhatsApp number. The rows
// bleed 8 pixels past the text on each side. The columns' widths are fixed
// by their headings, the numbers' as wide as a number with its marks, so
// that no column moves when a row leaves or arrives, and every row has its
// rule below it, the last too, so that a rule comes and goes only with its
// row.
export function VendorsTable({
  shown,
}: {
  shown: ShownRow<VendorWithExpiringOffersResponse>[];
}) {
  return (
    <div className="-mx-2">
      <Table aria-label="Vendors to remind" className="table-fixed">
        <TableHeader>
          <TableRow className="border-b-0">
            <TableHead className="w-2/5 first:ps-2">Vendor</TableHead>
            <TableHead>Offers</TableHead>
            <TableHead className="w-40">Phone</TableHead>
            <TableHead className="w-44 pe-2">WhatsApp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="border-t border-rule [&_tr:last-child]:border-b">
          {shown.map((row) => (
            <TableRow
              key={row.key}
              className="leaves-rule relative hover:bg-secondary"
              {...movingProps(row)}
            >
              <Cell>
                <span>
                  <VendorLink vendor={row.item} />
                </span>
              </Cell>
              <Cell>
                <WhyToRemind vendor={row.item} />
              </Cell>
              <Cell links>
                <CallLink vendor={row.item} />
              </Cell>
              <Cell links>
                <ChatLink vendor={row.item} />
              </Cell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
