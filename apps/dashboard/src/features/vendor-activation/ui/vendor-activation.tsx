import type { VendorResponse } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';
import { useState } from 'react';

import { WhyNotAnswered } from '@/shared/api';
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  Button,
} from '@/shared/ui';

import { useDeactivateVendor, useReactivateVendor } from '../api/activation';

// The Admin deactivates an active Vendor, after confirming, because it logs
// the Vendor out (ACC-7), and reactivates a deactivated one with one tap,
// which only lets it log in again. In the Admin console's English.
//
// A deactivation that failed halfway, such as while Keycloak could not be
// reached, has already marked the Vendor, and is finished by doing it again:
// so after a failed deactivation the way to deactivate stays, beside the
// refusal, also for a Vendor already marked.
export function VendorActivation({ vendor }: { vendor: VendorResponse }) {
  const deactivate = useDeactivateVendor(vendor.id);
  const reactivate = useReactivateVendor(vendor.id);

  return (
    <div className="flex flex-col items-start gap-3">
      {vendor.active || deactivate.isError ? (
        <Deactivate
          name={vendor.name}
          pending={deactivate.isPending}
          confirm={() => {
            reactivate.reset();
            deactivate.mutate();
          }}
        />
      ) : (
        <Button
          variant="outline"
          disabled={reactivate.isPending}
          onClick={() => {
            deactivate.reset();
            reactivate.mutate();
          }}
        >
          {reactivate.isPending ? 'Reactivating…' : 'Reactivate'}
        </Button>
      )}
      {deactivate.error && (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>The Vendor was not deactivated in full.</AlertTitle>
          <AlertDescription>
            <WhyNotAnswered error={deactivate.error} /> Deactivate it again to finish.
          </AlertDescription>
        </Alert>
      )}
      {reactivate.error && (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>The Vendor was not reactivated.</AlertTitle>
          <AlertDescription>
            <WhyNotAnswered error={reactivate.error} /> It is still deactivated.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// The way to deactivate, which asks the Admin to confirm first. Cancelling
// changes nothing.
function Deactivate({
  name,
  pending,
  confirm,
}: {
  name: string;
  pending: boolean;
  confirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" disabled={pending} />}>
        {pending ? 'Deactivating…' : 'Deactivate'}
      </AlertDialogTrigger>
      <AlertDialogContent data-testid="deactivate-confirmation">
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate this Vendor?</AlertDialogTitle>
          <AlertDialogDescription>
            <AsWritten>{name}</AsWritten> is logged out at once and cannot log in, and
            Shoppers no longer see it or its Offers, until you reactivate it. Its details
            and its password are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              setOpen(false);
              confirm();
            }}
          >
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
