import type { VendorResponse } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';
import { type ReactNode, useState } from 'react';

import { WhyNotAnswered } from '@/shared/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@/shared/ui';

import { useDeactivateVendor, useReactivateVendor } from '../api/activation';

// The Admin deactivates an active Vendor (ACC-7), and reactivates a
// deactivated one, each after confirming, in the Admin console's English.
// The buttons are drawn alone, for the Vendor's page to place in a row
// beside its other actions; each refusal is said in its confirmation.
//
// A deactivation that failed halfway, such as while Keycloak could not be
// reached, may have marked the Vendor and left its Login able to log in,
// and is finished by doing it again. The page cannot tell such a Vendor from
// one deactivated in full, so a deactivated Vendor's page keeps a quiet way
// to deactivate it again, after Reactivate.
export function VendorActivation({ vendor }: { vendor: VendorResponse }) {
  const deactivate = useDeactivateVendor(vendor.id);
  const reactivate = useReactivateVendor(vendor.id);
  const name = <AsWritten>{vendor.name}</AsWritten>;

  if (vendor.active) {
    return (
      <Confirmed
        change={deactivate}
        trigger="outline"
        confirmWith="destructive"
        action="Deactivate"
        pending="Deactivating…"
        title="Deactivate this Vendor?"
        description={
          <>
            {name} is logged out at once and cannot log in, and Shoppers no longer see it or
            its Offers, until you reactivate it. Its details and its password are kept.
          </>
        }
        notDone="The Vendor was not deactivated in full."
        testId="deactivate-confirmation"
      />
    );
  }

  return (
    <>
      <Confirmed
        change={reactivate}
        trigger="outline"
        confirmWith="default"
        action="Reactivate"
        pending="Reactivating…"
        title="Reactivate this Vendor?"
        description={
          <>
            {name} can log in again with the password it had, and Shoppers see it and its
            Offers again. Its details are kept.
          </>
        }
        notDone="The Vendor was not reactivated. It is still deactivated."
        testId="reactivate-confirmation"
      />
      <Confirmed
        change={deactivate}
        trigger="ghost"
        confirmWith="destructive"
        action="Deactivate again"
        pending="Deactivating…"
        title="Deactivate this Vendor again?"
        description={
          <>
            {name} is marked deactivated already. If its deactivation was not finished, it
            may still be able to log in: doing it again logs it out and stops it logging in.
            Nothing else changes.
          </>
        }
        notDone="The Vendor was not deactivated in full."
        testId="deactivate-confirmation"
      />
    </>
  );
}

// A button that opens an alert dialog asking the Admin to confirm a change
// first. Cancelling changes nothing. A change that is done closes the
// dialog, and one that is refused says what was not done, then why, in the
// dialog, which stays open to try again. A change that logs the Vendor out
// is confirmed with Action Red; one that lets it back in, with the primary
// button.
function Confirmed({
  change,
  trigger,
  confirmWith,
  action,
  pending,
  title,
  description,
  notDone,
  testId,
}: {
  change: ReturnType<typeof useDeactivateVendor>;
  trigger: 'outline' | 'ghost';
  confirmWith: 'destructive' | 'default';
  action: string;
  pending: string;
  title: string;
  description: ReactNode;
  notDone: string;
  testId: string;
}) {
  const [open, setOpen] = useState(false);

  function openOrClose(next: boolean): void {
    setOpen(next);
    // A refusal shown before belongs to an earlier try.
    if (next) change.reset();
  }

  return (
    <AlertDialog open={open} onOpenChange={openOrClose}>
      <AlertDialogTrigger render={<Button variant={trigger} />}>
        {action}
      </AlertDialogTrigger>
      <AlertDialogContent data-testid={testId}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {change.error && (
          <p role="alert" className="text-sm text-destructive">
            {notDone} <WhyNotAnswered error={change.error} />
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={confirmWith}
            disabled={change.isPending}
            onClick={() => change.mutate(undefined, { onSuccess: () => setOpen(false) })}
          >
            {change.isPending ? pending : action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
