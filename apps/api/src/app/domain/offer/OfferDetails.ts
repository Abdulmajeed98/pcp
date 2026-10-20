import { NotValidError } from '@pcp/core';
import { Either } from 'effect';

import { holdsText } from '../vendor/detail-text';
import { OfferDetailRefusal, offerDetailRefused } from './offer-errors';

// The largest Quoted Prices: 100,000.00 USD, in cents, and 150,000,000 IQD.
export const largestUsdPriceCents = 10_000_000;
export const largestIqdPrice = 150_000_000;

// The longest warranty, in months: ten years.
export const longestWarrantyMonths = 120;

// A USD price as a request writes it: Western digits, a minus sign or none,
// and a fractional part after a point or none.
const decimalNumber = /^(-?)(\d+)(?:\.(\d+))?$/;

// A USD price in cents, or why it was refused. It is read from its text,
// digit by digit, so that no binary fraction comes between what the Vendor
// typed and what is stored.
function usdPriceCentsOf(text: string): Either.Either<number, OfferDetailRefusal> {
  const match = decimalNumber.exec(text);
  if (match === null) return Either.left('notANumber');
  const [, sign, whole, fraction = ''] = match;

  if (sign === '-' || /^0*$/.test(whole + fraction)) return Either.left('notPositive');
  if (fraction.length > 2) return Either.left('tooManyDecimals');
  // More than six digits before the point is over the limit, and too many to
  // add up exactly.
  const significantWhole = whole.replace(/^0+(?=\d)/, '');
  if (significantWhole.length > 6) return Either.left('tooLarge');
  const cents = Number(significantWhole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents > largestUsdPriceCents) return Either.left('tooLarge');

  return Either.right(cents);
}

// An IQD price in whole dinars, or why it was refused.
function iqdPriceOf(dinars: number): Either.Either<number, OfferDetailRefusal> {
  if (dinars <= 0) return Either.left('notPositive');
  if (!Number.isInteger(dinars)) return Either.left('tooManyDecimals');
  if (dinars > largestIqdPrice) return Either.left('tooLarge');

  return Either.right(dinars);
}

// A warranty in whole months, or why it was refused.
function warrantyMonthsOf(months: number): Either.Either<number, OfferDetailRefusal> {
  if (!Number.isInteger(months)) return Either.left('notWholeMonths');
  if (months < 1) return Either.left('notPositive');
  if (months > longestWarrantyMonths) return Either.left('tooLarge');

  return Either.right(months);
}

// The details of an Offer as they were sent, before they are checked. A
// detail that was not given is null. The USD price is the text of a decimal
// number, so that its cents arrive as typed.
export class UncheckedOfferDetails {
  constructor(
    private readonly usdPrice: string | null,
    private readonly iqdPrice: number | null,
    private readonly inStock: boolean | null,
    private readonly warrantyMonths: number | null,
  ) {}

  getUsdPrice(): string | null {
    return this.usdPrice;
  }

  getIqdPrice(): number | null {
    return this.iqdPrice;
  }

  getInStock(): boolean | null {
    return this.inStock;
  }

  getWarrantyMonths(): number | null {
    return this.warrantyMonths;
  }
}

// The details of an Offer as they will be kept: its Quoted Prices, at least
// one, whether the Part is in stock, and the warranty, if the Vendor states
// one (OFF-2).
export class OfferDetails {
  private constructor(
    private readonly usdPriceCents: number | null,
    private readonly iqdPrice: number | null,
    private readonly inStock: boolean,
    private readonly warrantyMonths: number | null,
  ) {}

  // The details as they will be kept, or the refusal of the first that does
  // not fit, in the form's order: USD, IQD, in stock, warranty. No price at
  // all is refused on the USD price, the form's first.
  static check(typed: UncheckedOfferDetails): Either.Either<OfferDetails, NotValidError> {
    const usdPrice = typed.getUsdPrice();
    const typedIqdPrice = typed.getIqdPrice();
    if (!holdsText(usdPrice) && typedIqdPrice === null) {
      return Either.left(offerDetailRefused('usdPrice', 'missing'));
    }

    let usdPriceCents: number | null = null;
    if (holdsText(usdPrice)) {
      const cents = usdPriceCentsOf(usdPrice);
      if (Either.isLeft(cents))
        return Either.left(offerDetailRefused('usdPrice', cents.left));
      usdPriceCents = cents.right;
    }

    let iqdPrice: number | null = null;
    if (typedIqdPrice !== null) {
      const dinars = iqdPriceOf(typedIqdPrice);
      if (Either.isLeft(dinars)) {
        return Either.left(offerDetailRefused('iqdPrice', dinars.left));
      }
      iqdPrice = dinars.right;
    }

    const inStock = typed.getInStock();
    if (inStock === null) return Either.left(offerDetailRefused('inStock', 'missing'));

    let warrantyMonths: number | null = null;
    const typedWarrantyMonths = typed.getWarrantyMonths();
    if (typedWarrantyMonths !== null) {
      const months = warrantyMonthsOf(typedWarrantyMonths);
      if (Either.isLeft(months)) {
        return Either.left(offerDetailRefused('warrantyMonths', months.left));
      }
      warrantyMonths = months.right;
    }

    return Either.right(new OfferDetails(usdPriceCents, iqdPrice, inStock, warrantyMonths));
  }

  // The USD price in whole cents, or null when the Vendor quotes none.
  getUsdPriceCents(): number | null {
    return this.usdPriceCents;
  }

  // The IQD price in whole dinars, or null when the Vendor quotes none.
  getIqdPrice(): number | null {
    return this.iqdPrice;
  }

  isInStock(): boolean {
    return this.inStock;
  }

  // In whole months, or null when the Vendor states none.
  getWarrantyMonths(): number | null {
    return this.warrantyMonths;
  }

  // Whether these details change what the Offer history records of an Offer
  // that has `before`'s prices and stock: either Quoted Price, or whether it
  // is in stock (OFF-10). A change to the warranty alone, or none at all, is
  // no change the history records.
  changePricesOrStockOf(before: PricesAndStock): boolean {
    return (
      this.usdPriceCents !== before.usdPriceCents ||
      this.iqdPrice !== before.iqdPrice ||
      this.inStock !== before.inStock
    );
  }
}

// An Offer's Quoted Prices, USD in whole cents and IQD in whole dinars, each
// null when not quoted, and whether it is in stock: what the Offer history
// records of it.
export interface PricesAndStock {
  readonly usdPriceCents: number | null;
  readonly iqdPrice: number | null;
  readonly inStock: boolean;
}
