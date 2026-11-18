import { eq, SQL } from 'drizzle-orm';

import { OfferDetails } from '~/domain/offer/OfferDetails';
import { Transaction } from '~/infrastructure/database/transaction';

import { offer, offerHistory } from './offer.schema';

// The Offer module's writing of an Offer and of its history (OFF-10), written
// once and run inside a transaction it is handed: the Offer Store's own when
// a Vendor adds or changes an Offer, or another Store's when the Offer has to
// be written together with something else, as a fulfilled Part Request's
// is. Each history row is written in the transaction that changes the Offer.

// An Offer as it stands, held until the transaction it was read in ends.
export type HeldOffer = {
  readonly id: string;
  readonly vendorId: string;
  readonly partId: string;
  readonly usdPriceCents: number | null;
  readonly iqdPrice: number | null;
  readonly inStock: boolean;
  readonly confirmedAt: Date;
};

// What writing an Offer records: its details, the time of its Confirmation,
// the moment it is written, which its history row is dated by, and the
// Caller, whose Login the history records. A Vendor's own add or change is
// confirmed at the moment it is written.
export type OfferWriting = {
  readonly details: OfferDetails;
  readonly confirmedAt: Date;
  readonly writtenAt: Date;
  readonly callerId: string;
};

// The Offer that meets the condition, held until the transaction ends, so
// that a change made at the same time waits for this one and is then
// compared with what it wrote; or none.
export async function holdTheOffer(
  transaction: Transaction,
  which: SQL | undefined,
): Promise<HeldOffer | undefined> {
  const [held] = await transaction
    .select({
      id: offer.id,
      vendorId: offer.vendorId,
      partId: offer.partId,
      usdPriceCents: offer.usdPriceCents,
      iqdPrice: offer.iqdPrice,
      inStock: offer.inStock,
      confirmedAt: offer.confirmedAt,
    })
    .from(offer)
    .where(which)
    .for('update');

  return held;
}

// Writes the Vendor's new Offer for the Part, made at the moment written and
// confirmed at the time given, and the first row of its history, `created`,
// and answers its identifier. A second Offer for the same Vendor and Part
// breaks the unique pair, `oneOfferForAPart`, which the database refuses
// even when two arrive at once, and which the Store that handed the
// transaction tells apart.
export async function writeANewOffer(
  transaction: Transaction,
  vendorId: string,
  partId: string,
  writing: OfferWriting,
): Promise<string> {
  const [row] = await transaction
    .insert(offer)
    .values(aNewOffer(vendorId, partId, writing))
    .returning({ id: offer.id });
  await recordTheCreation(transaction, vendorId, partId, writing);

  return row.id;
}

// Writes the Vendor's new Offer for the Part as `writeANewOffer` does,
// unless the Vendor has one already, and answers its identifier; or writes
// nothing and answers none when the unique pair, `oneOfferForAPart`, finds
// the Vendor's own. The database finds it even when the Vendor's own add
// commits while this one writes, after the caller read the Vendor's Offers
// and found none: this one waits for that add, then leaves the Vendor's
// Offer to the caller, which reads it as it now stands, rather than being
// refused.
export async function writeANewOfferUnlessOneIsThere(
  transaction: Transaction,
  vendorId: string,
  partId: string,
  writing: OfferWriting,
): Promise<string | undefined> {
  const [row] = await transaction
    .insert(offer)
    .values(aNewOffer(vendorId, partId, writing))
    .onConflictDoNothing({ target: [offer.vendorId, offer.partId] })
    .returning({ id: offer.id });
  if (row === undefined) return undefined;
  await recordTheCreation(transaction, vendorId, partId, writing);

  return row.id;
}

// An Offer's row as a new Offer is written: made at the moment written, and
// confirmed at the time given.
function aNewOffer(vendorId: string, partId: string, writing: OfferWriting) {
  const details = writing.details;
  return {
    vendorId,
    partId,
    ...pricesAndStockOf(details),
    warrantyMonths: details.getWarrantyMonths(),
    confirmedAt: writing.confirmedAt,
    createdAt: writing.writtenAt,
  };
}

// The first row of a new Offer's history, `created`, at the moment written,
// by the Caller.
async function recordTheCreation(
  transaction: Transaction,
  vendorId: string,
  partId: string,
  writing: OfferWriting,
): Promise<void> {
  await transaction.insert(offerHistory).values({
    vendorId,
    partId,
    ...pricesAndStockOf(writing.details),
    changedAt: writing.writtenAt,
    change: 'created',
    changedBy: writing.callerId,
  });
}

// What the Offer history records of an Offer's details: its prices and its
// stock.
function pricesAndStockOf(details: OfferDetails) {
  return {
    usdPriceCents: details.getUsdPriceCents(),
    iqdPrice: details.getIqdPrice(),
    inStock: details.isInStock(),
  };
}

// Replaces the prices, the stock and the warranty of an Offer held in the
// transaction, clearing what the details leave out, and sets the time of its
// Confirmation. A `changed` row is added to its history only when a price or
// the stock changed, compared with the Offer as it was held, prices in whole
// cents (OFF-10).
export async function replaceTheDetailsOf(
  transaction: Transaction,
  held: HeldOffer,
  writing: OfferWriting,
): Promise<void> {
  const details = writing.details;
  const pricesAndStock = pricesAndStockOf(details);

  await transaction
    .update(offer)
    .set({
      ...pricesAndStock,
      warrantyMonths: details.getWarrantyMonths(),
      confirmedAt: writing.confirmedAt,
    })
    .where(eq(offer.id, held.id));
  if (details.changePricesOrStockOf(held)) {
    await transaction.insert(offerHistory).values({
      vendorId: held.vendorId,
      partId: held.partId,
      ...pricesAndStock,
      changedAt: writing.writtenAt,
      change: 'changed',
      changedBy: writing.callerId,
    });
  }
}
