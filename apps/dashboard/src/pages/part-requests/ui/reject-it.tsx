import type { PartRequestWithVendorResponse } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { Refusal, WhyNotAnswered } from '@/shared/api';
import { describedBy } from '@/shared/lib';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogRefusal,
  AlertDialogTitle,
  AlertDialogTrigger,
  BusyLabel,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  SectionTitle,
  Textarea,
} from '@/shared/ui';

import { askAgainAboutThePartRequests, isResolvedAlready, useReject } from '../api/resolve';

type Request = PartRequestWithVendorResponse;

// What is said beside the reason when it does not fit, by the reason the
// API gives, or the form's own check that one was given.
const reasonMessages: Record<string, string> = {
  missing: 'Give a reason: the Vendor is told why its Part was not added.',
  tooLong: 'The reason is over 300 characters.',
};

// Why the API refused the reason, if it did, said beside it.
function reasonRefused(error: Error | null): string | undefined {
  if (!(error instanceof Refusal)) return undefined;
  const reason = error.reasonFor('reason');
  return reason === undefined
    ? undefined
    : (reasonMessages[reason] ?? reasonMessages.missing);
}

// The last of a request's three ways: rejecting it with a reason, which the
// Vendor reads in its portal as the Admin wrote it, in shadcn/ui's alert
// dialog with the reason's field, the dialog being the one confirmation (the
// owner's d10, part-requests ticket 02). The dialog takes the focus to the
// field, and Enter in it writes a new line. A reason that is missing, or
// that the API refuses, is said below the field; any other refusal is said
// in the dialog, which stays open until the rejection is done. A refusal
// that says the request was resolved meanwhile closes it, and the screen
// shows how. Reject is the dialog's one red button.
export function RejectIt({ partRequest }: { partRequest: Request }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [missing, setMissing] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const reject = useReject(partRequest);
  const fieldError = missing ? reasonMessages.missing : reasonRefused(reject.error);
  const refusal =
    reject.error !== null &&
    reasonRefused(reject.error) === undefined &&
    !isResolvedAlready(reject.error)
      ? reject.error
      : null;

  function openOrClose(next: boolean): void {
    // A rejection on its way finishes before the dialog closes.
    if (!next && reject.isPending) return;
    setOpen(next);
    // A refusal shown before belongs to an earlier try.
    if (next) {
      reject.reset();
      setMissing(false);
    }
  }

  function rejectIt(): void {
    if (reason.trim() === '') {
      setMissing(true);
      field.current?.focus();
      return;
    }
    setMissing(false);
    reject.mutate(reason, {
      onError: (error) => {
        if (isResolvedAlready(error)) {
          setOpen(false);
          void askAgainAboutThePartRequests(queryClient);
        } else if (reasonRefused(error) !== undefined) {
          field.current?.focus();
        }
      },
    });
  }

  return (
    <section aria-labelledby="reject-it" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <SectionTitle id="reject-it" className="text-base font-semibold">
          Reject it
        </SectionTitle>
        <p className="text-sm text-muted-foreground">
          With a reason the Vendor reads in its portal, as you write it.
        </p>
      </div>
      <AlertDialog open={open} onOpenChange={openOrClose}>
        <AlertDialogTrigger
          render={<Button variant="outline" className="self-start text-destructive" />}
        >
          Reject…
        </AlertDialogTrigger>
        <AlertDialogContent
          initialFocus={field}
          aria-describedby="reject-request-name reject-request-description"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this Part Request?</AlertDialogTitle>
            <p id="reject-request-name" className="font-[550]">
              <AsWritten className="block w-fit max-w-full wrap-anywhere">
                {partRequest.name}
              </AsWritten>
            </p>
            <AlertDialogDescription id="reject-request-description">
              <AsWritten>{partRequest.vendor.name}</AsWritten> reads your reason in its
              portal, as you write it, and may send a corrected request. A rejected request
              is never reopened.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field>
            <FieldLabel htmlFor="rejection-reason">Reason</FieldLabel>
            <Textarea
              ref={field}
              id="rejection-reason"
              dir="auto"
              value={reason}
              aria-invalid={fieldError !== undefined}
              aria-describedby={describedBy(
                'rejection-reason-limit',
                fieldError && 'rejection-reason-error',
              )}
              onChange={(event) => setReason(event.target.value)}
            />
            <FieldDescription id="rejection-reason-limit">
              Up to 300 characters, in any language.
            </FieldDescription>
            <FieldError id="rejection-reason-error">{fieldError}</FieldError>
          </Field>
          <AlertDialogRefusal>
            {refusal && (
              <>
                The request was not rejected. <WhyNotAnswered error={refusal} />
              </>
            )}
          </AlertDialogRefusal>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reject.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={reject.isPending}
              onClick={rejectIt}
            >
              <BusyLabel busy={reject.isPending} label="Reject" busyLabel="Rejecting…" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
