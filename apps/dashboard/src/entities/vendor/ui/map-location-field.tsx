import { AlwaysEnglish } from '@pcp/ui';
import { LocateFixedIcon } from 'lucide-react';
import { useState } from 'react';
import {
  type Control,
  type FieldPath,
  type FieldValues,
  type PathValue,
  useController,
} from 'react-hook-form';

import { Trans, useTranslation } from '@/shared/i18n';
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  OptionalMark,
} from '@/shared/ui';

import { mapLocationIn } from '../model/map-location';

// What the location button has found out, when it is not a position.
type PositionProblem = 'notAllowed' | 'unavailable' | 'noPosition';

// The position the browser gives is written with seven decimals, about a
// centimetre, which is finer than any phone's position.
const decimals = 7;

// The field of a Vendor's map location, which a Vendor may leave out: the
// latitude and the longitude written as Google Maps writes a place's, and a
// button that fills them from the browser's own position, as the Admin or
// the Vendor stands in the Vendor's place. A browser that refuses its
// position, or has none, is said beside the field, and the coordinates can
// still be typed or pasted. Both forms of a Vendor's details use it, so its
// text is the dashboard's, in the language the dashboard is shown in.
//
// It holds the coordinates as written, and refuses text that is not two
// numbers. `mapLocationIn` reads them when the form is sent, and a refusal
// the API gives, such as a place outside Iraq, is set on it by the form.
export function MapLocationField<Values extends FieldValues>({
  control,
  name,
  id,
}: {
  control: Control<Values>;
  name: FieldPath<Values>;
  id: string;
}) {
  const { t } = useTranslation();
  const { field, fieldState } = useController({
    control,
    name,
    rules: {
      validate: (text: string) =>
        mapLocationIn(text) !== undefined || t('MapLocationField.notCoordinates'),
    },
  });
  const [finding, setFinding] = useState(false);
  const [problem, setProblem] = useState<PositionProblem | undefined>(undefined);
  const error = fieldState.error?.message;
  const optionalId = `${id}-optional`;
  const descriptionId = `${id}-description`;
  const positionId = `${id}-position`;
  const errorId = `${id}-error`;

  function fillFromThePosition(): void {
    setProblem(undefined);
    if (!('geolocation' in navigator)) {
      setProblem('noPosition');
      return;
    }

    setFinding(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFinding(false);
        field.onChange(
          `${Number(coords.latitude.toFixed(decimals))}, ${Number(coords.longitude.toFixed(decimals))}` as PathValue<
            Values,
            FieldPath<Values>
          >,
        );
      },
      (refused) => {
        setFinding(false);
        setProblem(
          refused.code === refused.PERMISSION_DENIED ? 'notAllowed' : 'unavailable',
        );
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  }

  return (
    <Field>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor={id}>{t('MapLocationField.label')}</FieldLabel>
        <OptionalMark id={optionalId}>{t('MapLocationField.optional')}</OptionalMark>
      </div>
      <Input
        id={id}
        dir="ltr"
        autoComplete="off"
        inputMode="text"
        aria-invalid={error !== undefined}
        aria-describedby={[
          optionalId,
          descriptionId,
          problem !== undefined ? positionId : undefined,
          error !== undefined ? errorId : undefined,
        ]
          .filter((each) => each !== undefined)
          .join(' ')}
        {...field}
        value={field.value as string}
      />
      <FieldDescription id={descriptionId}>
        <Trans
          i18nKey="MapLocationField.description"
          components={{ example: <AlwaysEnglish>36.19, 44.01</AlwaysEnglish> }}
        />
      </FieldDescription>
      <div>
        <Button
          type="button"
          variant="outline"
          disabled={finding}
          onClick={fillFromThePosition}
        >
          <LocateFixedIcon aria-hidden="true" />
          {t('MapLocationField.usePosition')}
        </Button>
      </div>
      <p id={positionId} aria-live="polite" className="text-sm empty:hidden">
        {finding && (
          <span className="text-muted-foreground">{t('MapLocationField.finding')}</span>
        )}
        {problem !== undefined && (
          <span className="text-destructive">{t(`MapLocationField.${problem}`)}</span>
        )}
      </p>
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}
