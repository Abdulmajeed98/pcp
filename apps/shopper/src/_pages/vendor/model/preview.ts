import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { publicAddress } from '@/shared/config';
import { chosenCurrency } from '@/shared/currency';
import { pageInTheAddress } from '@/shared/lib';

import { readTheVendorPage } from '../api/read-the-vendor-page';
import { vendorPreview } from './vendor-preview';

// The address of a Vendor page, as Next hands it to the page: its language
// and the Vendor's identifier, and its query, which holds the page of its
// Offers.
export interface VendorPageParams {
  params: Promise<{ locale: string; vendorId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// A Vendor page's preview (`vendorPreview`), from the Vendor as the page
// reads it, in its language. A Vendor that is not found answers "not found";
// one the API did not answer keeps the site's own title. Its canonical
// address is the Vendor page's own, whatever page of its Offers the address
// holds.
export async function generateMetadata({
  params,
  searchParams,
}: VendorPageParams): Promise<Metadata> {
  const [{ vendorId }, address, language, currency] = await Promise.all([
    params,
    searchParams,
    getLocale(),
    chosenCurrency(),
  ]);
  const reading = await readTheVendorPage(
    vendorId,
    currency,
    pageInTheAddress(address.page),
  );
  if (reading.kind === 'not-found') notFound();
  if (reading.kind === 'not-read') return {};

  return vendorPreview({
    language,
    vendor: reading.vendor,
    publicAddress: publicAddress(),
  });
}
