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
// reached, may have marked the Vendor and left its Login able to log in,
// and is finished by doing it again. The page cannot tell such a Vendor from
// one deactivated in full, so a deactivated Vendor's page keeps a quiet way
// to deactivate it again, after Reactivate.
export function VendorActivation({ vendor }: { vendor: VendorResponse }) {
  const deactivate = useDeactivateVendor(vendor.id);
  const reactivate = useReactivateVendor(vendor.id);

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap items-start gap-2">
        {!vendor.active && (
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
        <Deactivate
          name={vendor.name}
          again={!vendor.active}
          deactivation={deactivate}
          beforeDeactivating={() => reactivate.reset()}
        />
      </div>
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
// changes nothing. A deactivation that is done closes the confirmation, and
// one that is refused says why in it, which stays open to try again: one
// that failed halfway is finished by doing it again. For a Vendor already
// deactivated it is a ghost button after Reactivate, and says "again".
function Deactivate({
  name,
  again,
  deactivation,
  beforeDeactivating,
}: {
  name: string;
  again: boolean;
  deactivation: ReturnType<typeof useDeactivateVendor>;
  beforeDeactivating: () => void;
}) {
  const [open, setOpen] = useState(false);
  const action = again ? 'Deactivate again' : 'Deactivate';

  function openOrClose(next: boolean): void {
    setOpen(next);
    // A refusal shown before belongs to an earlier try.
    if (next) deactivation.reset();
  }

  function confirm(): void {
    beforeDeactivating();
    deactivation.mutate(undefined, { onSuccess: () => setOpen(false) });
  }

  return (
    <AlertDialog open={open} onOpenChange={openOrClose}>
      <AlertDialogTrigger render={<Button variant={again ? 'ghost' : 'outline'} />}>
        {action}
      </AlertDialogTrigger>
      <AlertDialogContent data-testid="deactivate-confirmation">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {again ? 'Deactivate this Vendor again?' : 'Deactivate this Vendor?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {again ? (
              <>
                <AsWritten>{name}</AsWritten> is marked deactivated already. If its
                deactivation was not finished, it may still be able to log in: doing it
                again logs it out and stops it logging in. Nothing else changes.
              </>
            ) : (
              <>
                <AsWritten>{name}</AsWritten> is logged out at once and cannot log in, and
                Shoppers no longer see it or its Offers, until you reactivate it. Its
                details and its password are kept.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deactivation.error && (
          <p role="alert" className="text-sm text-destructive">
            The Vendor was not deactivated in full.{' '}
            <WhyNotAnswered error={deactivation.error} />
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deactivation.isPending}
            onClick={confirm}
          >
            {deactivation.isPending ? 'Deactivating…' : action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
