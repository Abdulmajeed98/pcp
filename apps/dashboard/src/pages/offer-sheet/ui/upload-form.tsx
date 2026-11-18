import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { FileUpIcon, UploadIcon } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';

import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import { describedBy } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  BusyLabel,
  Button,
  buttonVariants,
  FieldDescription,
  FieldError,
  FileName,
  OpeningSpace,
} from '@/shared/ui';

import { useUploadOfferSheet } from '../api/offer-sheet';
import { type FileRefusal, fileRefusalOf } from '../model/file-refusals';
import { BusyMark } from './busy-mark';

// What the file field takes: an .xlsx file, by its extension and its type,
// so that a phone opens its own picker where a downloaded file is.
const anOfferSheet =
  '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// The upload: its heading, one Note Grey sentence on what a changed, an
// added and a deleted row do, the file field, then the pane's one primary
// button, "Upload the Offer sheet", as wide as the column on a phone, and
// below it the status line that names the file while it is on its way.
// While it is on its way the button says so, its mark turns, and neither
// the field nor the button takes the file again. A refusal of the file is
// one sentence beside the field, in the portal's language, one for each
// reason, naming no limit; any other refusal, or an API that cannot be
// reached, is the refusal panel above the button (DESIGN.md's States).
export function UploadForm({ vendorId }: { vendorId: string }) {
  const { t } = useTranslation();
  const upload = useUploadOfferSheet(vendorId);
  const field = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<File | undefined>(undefined);
  // Whether the button was pressed with no file chosen.
  const [missing, setMissing] = useState(false);
  const busy = upload.isPending;
  const refusal: FileRefusal | undefined = missing
    ? 'missing'
    : fileRefusalOf(upload.error);
  const notUploaded = upload.error !== null && refusal === undefined ? upload.error : null;

  function choose(event: ChangeEvent<HTMLInputElement>): void {
    setChosen(event.target.files?.[0]);
    setMissing(false);
    upload.reset();
  }

  function send(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (busy) return;
    if (chosen === undefined) {
      upload.reset();
      setMissing(true);
      field.current?.focus();
      return;
    }
    setMissing(false);
    upload.mutate(chosen, {
      onError: (error) => {
        if (fileRefusalOf(error) !== undefined) field.current?.focus();
      },
    });
  }

  return (
    <form
      noValidate
      aria-labelledby="offer-sheet-upload"
      className="flex flex-col gap-3"
      onSubmit={send}
    >
      <h2 id="offer-sheet-upload" className="text-base font-semibold">
        {t('OfferSheetScreen.uploadTitle')}
      </h2>
      <p className="text-sm text-muted-foreground">{t('OfferSheetScreen.uploadIntro')}</p>

      <div className="flex flex-col gap-2">
        <span id="offer-sheet-file-label" className="text-sm font-medium">
          {t('OfferSheetScreen.fileLabel')}
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* The browser's own field, wearing an outlined button that is its
              label, so that the whole button takes the tap (Fields). */}
          <input
            ref={field}
            id="offer-sheet-file"
            type="file"
            accept={anOfferSheet}
            className="peer sr-only"
            aria-labelledby="offer-sheet-file-label offer-sheet-file-button"
            aria-describedby={describedBy(
              'offer-sheet-file-description',
              refusal !== undefined && 'offer-sheet-file-error',
            )}
            aria-invalid={refusal !== undefined}
            disabled={busy}
            onChange={choose}
          />
          <label
            id="offer-sheet-file-button"
            htmlFor="offer-sheet-file"
            className={buttonVariants({
              variant: 'outline',
              className: cn(
                'cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:cursor-progress peer-disabled:opacity-50',
                refusal !== undefined && 'border-destructive',
              ),
            })}
          >
            <FileUpIcon data-icon="inline-start" aria-hidden="true" />
            {chosen === undefined
              ? t('OfferSheetScreen.chooseFile')
              : t('OfferSheetScreen.chooseAnother')}
          </label>
          <span
            data-testid="chosen-file"
            className={cn(
              'min-w-0 text-sm',
              chosen === undefined ? 'text-muted-foreground' : 'font-medium',
            )}
          >
            {chosen === undefined ? (
              t('OfferSheetScreen.noFile')
            ) : (
              <FileName name={chosen.name} />
            )}
          </span>
        </div>
        <FieldDescription id="offer-sheet-file-description">
          <Trans
            i18nKey="OfferSheetScreen.fileDescription"
            components={{ xlsx: <AlwaysEnglish>.xlsx</AlwaysEnglish> }}
          />
        </FieldDescription>
        <FieldError id="offer-sheet-file-error">
          {refusal !== undefined && (
            <span data-testid="file-refusal" data-reason={refusal}>
              <Trans
                i18nKey={`OfferSheetScreen.refused.${refusal}`}
                components={{ xlsx: <AlwaysEnglish>.xlsx</AlwaysEnglish> }}
              />
            </span>
          )}
        </FieldError>
      </div>

      <OpeningSpace>
        {notUploaded !== null && (
          <Alert variant="destructive" data-testid="upload-refusal">
            <AlertTitle>{t('OfferSheetScreen.notUploaded')}</AlertTitle>
            <AlertDescription>
              <WhyNotAnsweredInThePortal error={notUploaded} />
            </AlertDescription>
          </Alert>
        )}
      </OpeningSpace>
      <Button
        type="submit"
        data-testid="upload-offer-sheet"
        className="w-full sm:w-auto sm:self-start"
        disabled={busy}
      >
        <BusyMark busy={busy} Icon={UploadIcon} />
        <BusyLabel
          busy={busy}
          label={t('OfferSheetScreen.upload')}
          busyLabel={t('OfferSheetScreen.uploading')}
        />
      </Button>
      {/* The line that names the file while it is on its way: its space
          opens as it arrives and closes as it goes, so that nothing below
          it moves in one frame (the No Snap Rule); a screen reader hears it
          from a region always in the page. */}
      <OpeningSpace>
        {busy && chosen !== undefined && (
          <p
            aria-hidden="true"
            data-testid="upload-status"
            className="text-sm text-muted-foreground"
          >
            <UploadingStatus name={chosen.name} />
          </p>
        )}
      </OpeningSpace>
      <output className="sr-only">
        {busy && chosen !== undefined && <UploadingStatus name={chosen.name} />}
      </output>
    </form>
  );
}

// What the status line says while a file is on its way, naming it.
function UploadingStatus({ name }: { name: string }) {
  return (
    <Trans
      i18nKey="OfferSheetScreen.uploadingStatus"
      components={{ file: <FileName name={name} /> }}
    />
  );
}
