import { CameraIcon } from 'lucide-react';
import type { ChangeEvent } from 'react';

import { Alert, AlertDescription, AlertTitle, buttonVariants } from '@/shared/ui';

import { useAddPhoto } from '../api/add-photo';
import { whyNotAdded } from '../model/refusals';

// The pictures the API takes. A phone asked for these converts a photo it
// keeps in another format, as an iPhone keeps HEIC, to JPEG as it sends it.
const pictures = 'image/jpeg,image/png,image/webp';

// The way to add a Part's photo, or to replace the one it has: a button that
// opens the phone's camera or its pictures, and sends the one chosen at
// once. The file field itself is hidden, and its label is the button, so
// that the button carries the field's name and its focus.
//
// As the dashboard's DESIGN.md has a busy button (redesign ticket 08): while
// the photo is on its way, the button keeps its width, says "Sending…" and
// waits; the word is short, so that the button at rest is not wider than its
// own words (break-ui). A refusal is the refusal panel below it, which says what was
// not done and why, and arrives as Motion 6 says.
export function PhotoField({ partId, hasPhoto }: { partId: string; hasPhoto: boolean }) {
  const addPhoto = useAddPhoto(partId);
  const label = hasPhoto ? 'Replace the photo' : 'Add a photo';
  const busy = addPhoto.isPending;

  function send(event: ChangeEvent<HTMLInputElement>): void {
    const photo = event.target.files?.[0];
    // The same file can be chosen again after a refusal.
    event.target.value = '';
    if (photo !== undefined) addPhoto.mutate(photo);
  }

  return (
    <>
      <div>
        <input
          id="part-photo"
          type="file"
          accept={pictures}
          className="peer sr-only"
          disabled={busy}
          onChange={send}
        />
        <label
          htmlFor="part-photo"
          className={buttonVariants({
            variant: 'outline',
            className:
              'cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:cursor-progress',
          })}
        >
          <CameraIcon data-icon="inline-start" aria-hidden="true" />
          {/* The two words in one cell, so that the button keeps the width
              of the longer while it waits. */}
          <span className="grid">
            <span
              className={
                busy ? 'invisible col-start-1 row-start-1' : 'col-start-1 row-start-1'
              }
            >
              {label}
            </span>
            <span
              className={
                busy ? 'col-start-1 row-start-1' : 'invisible col-start-1 row-start-1'
              }
            >
              Sending…
            </span>
          </span>
        </label>
      </div>
      {/* The field loses the focus while it waits, so its words are also
          said aloud. */}
      <p aria-live="polite" className="sr-only">
        {busy && 'Sending the photo…'}
      </p>
      {addPhoto.error && (
        <Alert variant="destructive" data-testid="photo-refusal" className="basis-full">
          <AlertTitle>The photo was not added.</AlertTitle>
          <AlertDescription>{whyNotAdded(addPhoto.error)}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
