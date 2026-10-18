import { AsWritten } from '@pcp/ui';
import { useLayoutEffect } from 'react';
import { Link, useParams } from 'react-router';

import { useVendor } from '@/entities/vendor';
import { showIn, Trans, useTranslation } from '@/shared/i18n';

import { halves } from '../halves';
import { PortalFrame } from './vendor-portal-frame';

// The Vendor portal as the Admin opens it from a Vendor's page, to act as
// that Vendor with the Admin's own Login (ACC-6). Its address is under the
// Vendor's page and names the Vendor, and the frame reads the Vendor by it,
// through the API's rule for who may act for a Vendor, which lets the Admin
// name any. So every request carries the Admin's own token, and Keycloak's
// impersonation is not used (ADR-0009). Its screens are the Vendor portal's
// own, under the band that names the Vendor.
//
// While it is open the dashboard is shown as the Vendor portal is, by the
// portal's own rule, and its switch works and is remembered in this
// browser, which is the Admin's own. Leaving it, by the band's link or any
// other way, shows the Admin console again: English, left to right, with its
// own title. The change is made before the browser paints, so neither half
// is drawn in the other's language.
export function ActingAsVendorFrame() {
  const { vendorId = '' } = useParams();
  const vendor = useVendor(vendorId);

  useLayoutEffect(() => {
    void showIn(halves['vendor-portal']);
    return () => void showIn(halves['admin-console']);
  }, []);

  return (
    <PortalFrame
      vendor={vendor}
      band={
        <ActingBand
          vendorId={vendorId}
          name={vendor.data?.name}
          deactivated={vendor.data?.active === false}
        />
      }
    />
  );
}

// The band above every screen while the Admin acts as a Vendor: a sentence
// that names the Vendor, as written, once it is read, and a link back to the
// Vendor's page in the Admin console. It is in the portal's language,
// because the Vendor may be reading over the Admin's shoulder. It runs the
// whole width, on a Shelf ground closed by a Rule Sand rule, so that it is
// never taken for part of the Vendor's own portal, and its text is laid out
// as the frame's is. The Admin may act as a deactivated Vendor, and the band
// then says so, in a second sentence.
function ActingBand({
  vendorId,
  name,
  deactivated,
}: {
  vendorId: string;
  name: string | undefined;
  deactivated: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div data-testid="acting-band" className="border-b border-border bg-secondary">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-4 px-4 wrap-break-word sm:px-6">
        {name !== undefined && (
          <p className="min-w-0 py-2 text-sm font-medium">
            <Trans
              i18nKey="ActingAsVendor.actingAs"
              components={{ name: <AsWritten>{name}</AsWritten> }}
            />
            {deactivated && (
              <>
                {' '}
                <span data-testid="acting-band-deactivated">
                  {t('ActingAsVendor.deactivated')}
                </span>
              </>
            )}
          </p>
        )}
        <Link
          to={`/vendors/${vendorId}`}
          className="ms-auto flex min-h-control items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {t('ActingAsVendor.back')}
        </Link>
      </div>
    </div>
  );
}
