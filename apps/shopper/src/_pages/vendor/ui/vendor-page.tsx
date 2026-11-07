import { notFound } from 'next/navigation';

import { chosenCurrency } from '@/shared/currency';
import { pageInTheAddress } from '@/shared/lib';
import { photographs } from '@/shared/photographs';
import { DimPhotograph, MarkADrawingAgain } from '@/shared/ui';
import { BackCover } from '@/widgets/back-cover';
import { Stub } from '@/widgets/frame-header';

import { readTheVendorPage } from '../api/read-the-vendor-page';
import type { VendorPageParams } from '../model/preview';
import { Coupon } from './coupon';
import { NotRead } from './not-read';
import { VendorOffers } from './vendor-offers';

// A Vendor page, at `/<language>/vendors/<vendorId>` (DESIGN.md's A Vendor
// page, BRW-4): the stub; over a dim photograph of a water-cooled PC, the
// coupon, the Vendor's name, city, address and opening hours as it wrote
// them, its contact details each a link, and its tear-off tabs; then the
// sheet of its Visible Offers, grouped by Category, centred; the back
// cover, with the photograph the page lies on.
//
// It is drawn on the server for each request, in the language of its address
// and the chosen currency, from what the API answers then, for the page of
// Offers its address holds. A deactivated Vendor, and an unknown one, answer
// the "not found" page with the status 404, in the page's language (ACC-7);
// a Vendor the API did not answer says it cannot be read just now.
export async function VendorPage({ params, searchParams }: VendorPageParams) {
  const [{ vendorId }, address, currency] = await Promise.all([
    params,
    searchParams,
    chosenCurrency(),
  ]);
  const page = pageInTheAddress(address.page);
  const reading = await readTheVendorPage(vendorId, currency, page);
  if (reading.kind === 'not-found') notFound();

  return (
    <>
      <MarkADrawingAgain />
      <Stub />
      {reading.kind === 'not-read' ? (
        <NotRead vendorId={vendorId} page={page} />
      ) : (
        <main className="relative isolate flex-1 px-ground-edge py-section-phone md:page-margins md:py-section">
          <DimPhotograph photograph={photographs.waterCooledPc} first />
          <section aria-labelledby="vendor-name">
            <Coupon vendor={reading.vendor} />
          </section>
          <VendorOffers
            vendorId={reading.vendor.id}
            offers={reading.offers}
            page={page}
            currency={currency}
          />
        </main>
      )}
      <BackCover photographs={[photographs.waterCooledPc]} />
    </>
  );
}
