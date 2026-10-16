import { CameraIcon } from 'lucide-react';
import type { ChangeEvent } from 'react';

import { buttonVariants } from '@/shared/ui';

import { useAddPhoto } from '../api/add-photo';
import { whyNotAdded } from '../model/refusals';

// The pictures the API takes. A phone asked for these converts a photo it
// keeps in another format, as an iPhone keeps HEIC, to JPEG as it sends it.
const pictures = 'image/jpeg,image/png,image/webp';

// The way to add a Part's photo, or to replace the one it has: a button that
// opens the phone's camera or its pictures, and sends the one chosen at
// once. The file field itself is hidden, and its label is the button, so
// that the button carries the field's name and its focus.
export function PhotoField({ partId, hasPhoto }: { partId: string; hasPhoto: boolean }) {
  const addPhoto = useAddPhoto(partId);

  function send(event: ChangeEvent<HTMLInputElement>): void {
    const photo = event.target.files?.[0];
    // The same file can be chosen again after a refusal.
    event.target.value = '';
    if (photo !== undefined) addPhoto.mutate(photo);
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <input
          id="part-photo"
          type="file"
          accept={pictures}
          className="peer sr-only"
          disabled={addPhoto.isPending}
          onChange={send}
        />
        <label
          htmlFor="part-photo"
          className={buttonVariants({
            variant: 'outline',
            className:
              'cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:opacity-50',
          })}
        >
          <CameraIcon data-icon="inline-start" aria-hidden="true" />
          {hasPhoto ? 'Replace the photo' : 'Add a photo'}
        </label>
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {addPhoto.isPending && 'Sending the photo…'}
      </p>
      {addPhoto.error && (
        <p data-testid="photo-refusal" role="alert" className="text-sm text-destructive">
          {whyNotAdded(addPhoto.error)}
        </p>
      )}
    </div>
  );
}
