import type { EditVendorRequest } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import { useVendor, vendorKey, vendorsKey } from '@/entities/vendor';
import { VendorForm } from '@/features/vendor-form';
import { apiClient, dataOf, Refusal, WhyNotAnswered } from '@/shared/api';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import { Alert, AlertDescription, AlertTitle, BackLink } from '@/shared/ui';

// The Admin's form for editing a Vendor, filled with every detail as it is,
// its name, its city and its login phone number among them (ACC-8). Saving
// replaces them all, so an optional detail emptied in the form is cleared. A
// new login phone number changes what the Vendor logs in with, and keeps its
// password. After a save the Vendor's page shows the new values. The screen
// names the Vendor, as it writes it, in its title and in its link back to
// the Vendor's page.
export function EditVendorPage() {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const { vendorId = '' } = useParams();
  const vendor = useVendor(vendorId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const edit = useMutation({
    mutationFn: (body: EditVendorRequest) =>
      dataOf(apiClient.editVendor({ path: { vendorId }, body })),
    onSuccess: async (edited) => {
      // The Vendor's page draws the Vendor as the API answered it, before it
      // asks again, and the list asks again for its new name.
      queryClient.setQueryData(vendorKey(vendorId), edited);
      await queryClient.invalidateQueries({ queryKey: vendorsKey });
      await navigate(keepingTheQuery(`/vendors/${vendorId}`));
    },
  });

  if (vendor.error) {
    const missing = vendor.error instanceof Refusal && vendor.error.status === 404;
    return (
      <div className="flex flex-col gap-4">
        <BackLink to={keepingTheQuery('/vendors')}>Vendors</BackLink>
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>
            {missing ? 'Vendor not found.' : 'The Vendor could not be read.'}
          </AlertTitle>
          <AlertDescription>
            {missing ? (
              'The platform holds no Vendor at this address.'
            ) : (
              <WhyNotAnswered error={vendor.error} />
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (vendor.data === undefined) {
    return <p className="text-sm text-muted-foreground">Reading the Vendor…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink to={keepingTheQuery(`/vendors/${vendorId}`)}>
        <AsWritten>{vendor.data.name}</AsWritten>
      </BackLink>
      <h1 className="text-xl font-semibold sm:text-2xl">
        Edit <AsWritten>{vendor.data.name}</AsWritten>
      </h1>
      <VendorForm
        vendor={vendor.data}
        submitLabel="Save"
        save={(body) => edit.mutateAsync(body)}
      />
    </div>
  );
}
