import type { ListedOfferResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router';

import { categoryName } from '@/entities/category';
import {
  type ConfirmationState,
  confirmationOf,
  iqdPriceShown,
  usdPriceShown,
} from '@/entities/offer';
import { PartPicture } from '@/entities/part';
import { Trans, useTranslation } from '@/shared/i18n';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Plate,
} from '@/shared/ui';

// One of the Vendor's Offers in the list: its Part's picture, its name and,
// on one secondary line, its manufacturer and Category; then its prices,
// each on a plate, both when both were quoted; then its last Confirmation,
// its stock and its warranty. A Part's name, its manufacturer and the prices
// are English in every language, and are kept apart from the text around
// them (LANG-3, LANG-5). The Category is named in the shared terms.
//
// The whole row is the link to the Offer, the form that changes it, as a
// Part the catalog search found is, while the link's name is the Part's
// alone. The link is relative to the Offers screen's route, so that it
// reaches the Offer under either frame.
export function OfferRow({ offer }: { offer: ListedOfferResponse }) {
  const { t } = useTranslation();
  const { part } = offer;

  return (
    <Item
      data-testid="offer"
      className="relative items-start rounded-none px-0 hover:bg-secondary has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2"
    >
      <ItemMedia>
        <PartPicture part={part} />
      </ItemMedia>
      <ItemContent className="gap-2">
        <div className="flex flex-col gap-0.5">
          <ItemTitle>
            <Link
              to={`offers/${offer.id}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              <AlwaysEnglish data-testid="part-name">{part.name}</AlwaysEnglish>
            </Link>
          </ItemTitle>
          <ItemDescription>
            <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
            {' · '}
            <span data-testid="category" data-category={part.category}>
              {categoryName(part.category)}
            </span>
          </ItemDescription>
        </div>
        <p className="flex flex-wrap gap-2">
          {offer.usdPrice !== null && (
            <Plate>
              <AlwaysEnglish data-testid="usd-price">
                {usdPriceShown(offer.usdPrice)}
              </AlwaysEnglish>
            </Plate>
          )}
          {offer.iqdPrice !== null && (
            <Plate>
              <AlwaysEnglish data-testid="iqd-price">
                {iqdPriceShown(offer.iqdPrice)}
              </AlwaysEnglish>
            </Plate>
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Confirmation state={confirmationOf(offer)} />
          <span
            data-testid="stock"
            data-in-stock={offer.inStock}
            className={offer.inStock ? 'text-success' : 'text-muted-foreground'}
          >
            {offer.inStock ? t('Offer.inStock') : t('Offer.outOfStock')}
          </span>
          {offer.warrantyMonths !== null && (
            <span data-testid="warranty" className="text-muted-foreground">
              <Trans
                i18nKey="Offer.warranty"
                count={offer.warrantyMonths}
                components={{ count: <>{formatNumber(offer.warrantyMonths)}</> }}
              />
            </span>
          )}
        </p>
      </ItemContent>
    </Item>
  );
}

// Each state's mark and colour: confirmed today in Confirmed Green, an older
// Confirmation in Note Grey, and an Offer about to expire or expired in
// Action Red, which marks what needs the Vendor's action. Each is also said
// in words.
const looks: Record<ConfirmationState['state'], { Icon: LucideIcon; className: string }> = {
  today: { Icon: CircleCheckIcon, className: 'text-success' },
  daysAgo: { Icon: ClockIcon, className: 'text-muted-foreground' },
  expiresIn: { Icon: TriangleAlertIcon, className: 'font-medium text-destructive' },
  expiresToday: { Icon: TriangleAlertIcon, className: 'font-medium text-destructive' },
  expired: { Icon: CircleXIcon, className: 'font-medium text-destructive' },
};

// When the Offer was last confirmed, in a sentence that counts its days.
function Confirmation({ state }: { state: ConfirmationState }) {
  const { Icon, className } = looks[state.state];

  return (
    <span
      data-testid="confirmation"
      data-state={state.state}
      className={cn('inline-flex items-center gap-1', className)}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <ConfirmationWords state={state} />
    </span>
  );
}

function ConfirmationWords({ state }: { state: ConfirmationState }) {
  const { t } = useTranslation();

  switch (state.state) {
    case 'today':
      return <>{t('Offer.confirmedToday')}</>;
    case 'expiresToday':
      return <>{t('Offer.expiresToday')}</>;
    case 'daysAgo':
      return <Counted i18nKey="Offer.confirmedDaysAgo" count={state.count} />;
    case 'expiresIn':
      return <Counted i18nKey="Offer.expiresIn" count={state.count} />;
    case 'expired':
      return <Counted i18nKey="Offer.expired" count={state.count} />;
  }
}

// A sentence that counts days, with its count written by `formatNumber`.
function Counted({
  i18nKey,
  count,
}: {
  i18nKey: 'Offer.confirmedDaysAgo' | 'Offer.expiresIn' | 'Offer.expired';
  count: number;
}) {
  return (
    <span>
      <Trans
        i18nKey={i18nKey}
        count={count}
        components={{ count: <>{formatNumber(count)}</> }}
      />
    </span>
  );
}
