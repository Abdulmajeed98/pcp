import type { CreatedVendorResponse, CreateVendorRequest } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router';

import { vendorsKey } from '@/entities/vendor';
import { HandOver, TemporaryPassword } from '@/features/hand-over';
import { VendorForm } from '@/features/vendor-form';
import { apiClient, dataOf } from '@/shared/api';
import { useAddressKeepingTheQuery, useWideScreen } from '@/shared/lib';
import { BackLink, buttonVariants } from '@/shared/ui';

// The form for a new Vendor. Creating it makes the Vendor and its Login, and
// the screen then shows the Login's temporary password, this once, beside
// the hand-over. The password is held by this screen alone: leaving it, or
// opening a new form, loses it, and the API answers it nowhere else.
export function NewVendorPage() {
  // The same address opened again, from the list's New Vendor, is a new form.
  const { key } = useLocation();
  return <NewVendor key={key} />;
}

function NewVendor() {
  // One h1 to a page (the owner's "h2 on a desk", redesign ticket 08):
  // from 64rem this screen is beside the Vendors' list, whose title is the
  // h1, so its own is an h2; on a phone it stands alone, an h1.
  const Title = useWideScreen() ? 'h2' : 'h1';
  const keepingTheQuery = useAddressKeepingTheQuery();
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (body: CreateVendorRequest) => dataOf(apiClient.createVendor({ body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorsKey }),
  });

  if (create.data !== undefined) return <Created created={create.data} />;

  return (
    <div className="flex flex-col gap-4">
      <BackLink to={keepingTheQuery('/vendors')}>Vendors</BackLink>
      <Title className="screen-title">New Vendor</Title>
      <VendorForm
        submitLabel="Create the Vendor"
        busyLabel="Creating the Vendor…"
        save={(body) => create.mutateAsync(body)}
      />
    </div>
  );
}

// The Vendor just created: its temporary password, the hand-over, and the
// way to its page.
function Created({
  created: { vendor, temporaryPassword },
}: {
  created: CreatedVendorResponse;
}) {
  // One h1 to a page (the owner's "h2 on a desk", redesign ticket 08):
  // from 64rem this screen is beside the Vendors' list, whose title is the
  // h1, so its own is an h2; on a phone it stands alone, an h1.
  const Title = useWideScreen() ? 'h2' : 'h1';
  const keepingTheQuery = useAddressKeepingTheQuery();

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 pb-6">
        <BackLink to={keepingTheQuery('/vendors')}>Vendors</BackLink>
        <Title className="screen-title">
          <AsWritten>{vendor.name}</AsWritten>
        </Title>
        <p>The Vendor and its Login are made.</p>
      </div>

      {/* The temporary password and the hand-over arrive as a reset's do
          (the owner's "Arrives smoothly", redesign ticket 09; Motion 8 and
          the No Snap Rule): their space opens, the link below sliding down,
          and then they fade in. The space below them is their own padding,
          inside what opens. */}
      <div data-testid="vendor-created" data-arriving="" className="leaves">
        <div className="flex flex-col gap-6 pb-6">
          <TemporaryPassword password={temporaryPassword} />
          <HandOver
            loginPhoneNumber={vendor.loginPhoneNumber}
            temporaryPassword={temporaryPassword}
          />
        </div>
      </div>

      <Link
        to={keepingTheQuery(`/vendors/${vendor.id}`)}
        className={buttonVariants({ variant: 'outline', className: 'self-start' })}
      >
        Open the Vendor’s page
      </Link>
    </div>
  );
}
