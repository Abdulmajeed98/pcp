import { and, eq, gte, sql, SQL } from 'drizzle-orm';

import { visibleOfferRuleAt } from '~/domain/offer/visibility';
import { part } from '~/infrastructure/part/part.schema';
import { vendor } from '~/infrastructure/vendor/vendor.schema';

import { offer } from './offer.schema';

// The rule for a visible Offer, as the database asks it, at now by the API's
// clock: of an active Vendor, and not an Expired Offer (`visibility.ts`). A
// query that uses it joins the Vendor. Every query of visible Offers uses it,
// and no other: a Part's and a Vendor's Offers, a Category's Visible Parts and
// the platform's figures, each in its Store.
export function visibleOffer(now: Date): SQL | undefined {
  const rule = visibleOfferRuleAt(now);
  return and(
    eq(vendor.active, rule.vendorActive),
    gte(offer.confirmedAt, rule.confirmedFrom),
  );
}

// The rule for a Visible Part, as the database asks it of a Part, at now by
// the API's clock: a Part with at least one visible Offer, by
// `visibleOffer(now)` (CAT-7). Every query of Parts for Shoppers asks it of
// `part`, and no other: a Category's list, a Visible Part's own read, its
// Category's filters and the picker (`browse` and `builder`).
export function visiblePart(now: Date): SQL {
  return sql`exists (select 1 from ${offer} inner join ${vendor} on ${eq(vendor.id, offer.vendorId)} where ${and(eq(offer.partId, part.id), visibleOffer(now))})`;
}
