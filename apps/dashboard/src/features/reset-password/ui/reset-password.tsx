import { AsWritten } from '@pcp/ui';
import { KeyRoundIcon } from 'lucide-react';
import { useState } from 'react';

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

import { useResetPassword } from '../api/reset-password';
import { whyNotReset } from '../model/refusals';

// The way to reset a Vendor's password (ACC-5), in the Admin console's
// English: an outlined button, which asks the Admin to confirm first,
// because a reset logs the Vendor out wherever it is logged in. Cancelling
// changes nothing. A reset that is done closes the confirmation and hands
// the new temporary password to the screen, which shows it with the
// hand-over; one that is refused says why in the confirmation, which stays
// open to try again.
export function ResetPassword({
  vendorId,
  vendorName,
  onReset,
}: {
  vendorId: string;
  vendorName: string;
  onReset: (temporaryPassword: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const reset = useResetPassword(vendorId);

  function openOrClose(next: boolean): void {
    setOpen(next);
    // A refusal shown before belongs to an earlier try.
    if (next) reset.reset();
  }

  function confirm(): void {
    reset.mutate(undefined, {
      onSuccess: ({ temporaryPassword }) => {
        setOpen(false);
        onReset(temporaryPassword);
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={openOrClose}>
      <AlertDialogTrigger render={<Button variant="outline" className="self-start" />}>
        <KeyRoundIcon data-icon="inline-start" aria-hidden="true" />
        Reset the password
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Reset the password of <AsWritten>{vendorName}</AsWritten>?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The Vendor is logged out wherever it is logged in, and its password stops
            working. A new temporary password is shown here once, to hand over, and the
            Vendor replaces it at its next login.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {reset.error && (
          <p role="alert" className="text-sm text-destructive">
            {whyNotReset(reset.error)}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={reset.isPending}
            onClick={confirm}
          >
            {reset.isPending ? 'Resetting…' : 'Reset the password'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
