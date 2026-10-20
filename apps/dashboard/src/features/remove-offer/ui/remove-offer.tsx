import type { OfferResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
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

import { useRemoveOffer } from '../api/remove-offer';

// The Vendor removes one of its Offers, for a Part it no longer sells, after
// confirming in shadcn/ui's alert dialog, in the portal's language, so that a
// stray tap removes nothing (OFF-4). The button is outlined, as every action
// beside a pane's primary one is; the dialog's action is in Action Red, since
// a removal is undone only by adding the Offer again. Cancelling changes
// nothing. A removal that is refused says what was not done, then why, in the
// dialog, which stays open to try again, and a removal on its way keeps it
// open too; once the Offer is removed, `onRemoved` leaves the screen.
export function RemoveOffer({
  vendorId,
  offer,
  onRemoved,
}: {
  vendorId: string;
  offer: OfferResponse;
  onRemoved: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const remove = useRemoveOffer(vendorId, offer.id, onRemoved);

  function openOrClose(next: boolean): void {
    // A removal on its way finishes before the dialog closes.
    if (!next && remove.isPending) return;
    setOpen(next);
    // A refusal shown before belongs to an earlier try.
    if (next) remove.reset();
  }

  return (
    <AlertDialog open={open} onOpenChange={openOrClose}>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            data-testid="remove-offer"
            className="w-full sm:w-auto sm:self-start"
          />
        }
      >
        <Trash2Icon data-icon="inline-start" />
        {t('RemoveOffer.remove')}
      </AlertDialogTrigger>
      <AlertDialogContent data-testid="remove-confirmation">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('RemoveOffer.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            <Trans
              i18nKey="RemoveOffer.description"
              components={{
                name: (
                  <AlwaysEnglish data-testid="part-name">{offer.part.name}</AlwaysEnglish>
                ),
              }}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.error && (
          <p role="alert" className="text-sm text-destructive">
            {t('RemoveOffer.notRemoved')} <WhyNotAnsweredInThePortal error={remove.error} />
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="cancel-removal" disabled={remove.isPending}>
            {t('RemoveOffer.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            data-testid="confirm-removal"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            {remove.isPending ? t('RemoveOffer.removing') : t('RemoveOffer.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
