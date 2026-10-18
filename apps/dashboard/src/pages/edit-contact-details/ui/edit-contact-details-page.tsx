import type { EditContactDetailsRequest } from '@pcp/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { useVendor, useVendorShown, vendorKey, vendorsKey } from '@/entities/vendor';
import { ContactDetailsForm } from '@/features/contact-details-form';
import { apiClient, dataOf, WhyNotAnsweredInThePortal } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { Alert, AlertDescription, AlertTitle, BackLink } from '@/shared/ui';

// The Vendor portal's screen for changing the Vendor's contact details, which
// it does itself, with no one's approval (ACC-8), filled with them as they
// are. Saving replaces them, so an optional detail emptied in the form is
// cleared, and leads back to the details screen, which shows the new values
// at once.
//
// Its way back and the way it leads after a save are written relative to its
// route, `..`, so that they reach the details screen under either frame the
// portal's screens are mounted in.
export function EditContactDetailsPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const vendor = useVendor(vendorId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const edit = useMutation({
    mutationFn: (body: EditContactDetailsRequest) =>
      dataOf(apiClient.editContactDetails({ path: { vendorId }, body })),
    onSuccess: async (edited) => {
      // The details screen draws the Vendor as the API answered it, before it
      // asks again.
      queryClient.setQueryData(vendorKey(vendorId), edited);
      await queryClient.invalidateQueries({ queryKey: vendorsKey });
      await navigate('..');
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <BackLink to="..">{t('ContactDetailsForm.back')}</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">
          {t('ContactDetailsForm.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('ContactDetailsForm.intro')}</p>
      </div>
      {vendor.error ? (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>{t('VendorDetails.notRead')}</AlertTitle>
          <AlertDescription>
            <WhyNotAnsweredInThePortal error={vendor.error} />
          </AlertDescription>
        </Alert>
      ) : vendor.data === undefined ? (
        <p className="text-sm text-muted-foreground">{t('VendorDetails.reading')}</p>
      ) : (
        <ContactDetailsForm vendor={vendor.data} save={(body) => edit.mutateAsync(body)} />
      )}
    </div>
  );
}
