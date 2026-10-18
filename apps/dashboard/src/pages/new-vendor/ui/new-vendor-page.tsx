import type { CreatedVendorResponse, CreateVendorRequest } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router';

import { vendorsKey } from '@/entities/vendor';
import { HandOver } from '@/features/hand-over';
import { VendorForm } from '@/features/vendor-form';
import { apiClient, dataOf } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
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
      <h1 className="text-xl font-semibold sm:text-2xl">New Vendor</h1>
      <VendorForm
        submitLabel="Create the Vendor"
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
  const keepingTheQuery = useAddressKeepingTheQuery();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink to={keepingTheQuery('/vendors')}>Vendors</BackLink>
        <h1 className="text-xl font-semibold sm:text-2xl">
          <AsWritten>{vendor.name}</AsWritten>
        </h1>
        <p>The Vendor and its Login are made.</p>
      </div>

      <section aria-labelledby="temporary-password-label" className="flex flex-col gap-2">
        <h2 id="temporary-password-label" className="text-sm font-medium">
          Temporary password
        </h2>
        <p
          data-testid="temporary-password"
          lang="en"
          dir="ltr"
          className="self-start rounded-lg border border-border bg-card px-3 py-2 font-mono text-2xl font-bold tracking-wider"
        >
          {temporaryPassword}
        </p>
        <p className="text-sm text-muted-foreground">
          Shown this once, and kept nowhere. Leaving this screen loses it. The Vendor
          replaces it with its own at its first login.
        </p>
      </section>

      <HandOver
        loginPhoneNumber={vendor.loginPhoneNumber}
        temporaryPassword={temporaryPassword}
      />

      <Link
        to={keepingTheQuery(`/vendors/${vendor.id}`)}
        className={buttonVariants({ variant: 'outline', className: 'self-start' })}
      >
        Open the Vendor’s page
      </Link>
    </div>
  );
}
