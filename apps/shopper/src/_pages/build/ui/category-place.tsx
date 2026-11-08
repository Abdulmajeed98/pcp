import type { BuildPartResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, CategoryIcon } from '@pcp/ui';
import { cn } from 'cn';
import { getLocale, getTranslations } from 'next-intl/server';

import {
  type Category,
  isKitOrDrive,
  mostKitsOrDrives,
  mostOfOne,
  type Refusal,
} from '@/entities/build';
import { partAddress, PartSquare } from '@/entities/part';
import {
  pickerAddress,
  placeOf,
  QuantityForm,
  RemoveForm,
  underlinedAction,
} from '@/features/change-the-build';
import { buttonVariants, Item } from '@/shared/ui';

// A Category on the Build's sheet (DESIGN.md's A Category on the Build's
// sheet): the Category's icon at 20 pixels and its name, in Body at 600 in
// Soft Ink, head its place, which an address leads to after a change
// (`#ram`). Under it each of its Parts is printed as a Part on a Category
// page is, its photo or its Category's icon in the small square, its name in
// English as a link to its Part page (a Visible Part only), and its
// manufacturer on its second line; ticket 08 of the builder module adds its
// price. Under the line, from the start of its words, its controls: Change,
// a link to its picker, or a kit's or a drive's quantity, at the start, and
// Remove at the end, never side by side. Several kits or drives follow one
// another 8 pixels apart, and under the last, while fewer than 8, Add
// another, a link to the picker.
//
// A Category with no Part is one cell of the Board across its place, a link
// to its picker; a GPU or a CPU cooler the CPU makes unneeded says so, with
// a link to choose one all the same. A Part the API left out, which the
// catalog no longer holds, leaves its Category not chosen.
//
// Each line the Build may gain or lose is named for the page's script
// (`data-line`), and so is the place's space (`data-space`), which the
// script moves when a change applies in place (Motion 11).
export async function CategoryPlace({
  category,
  parts,
  notNeeded,
  refused,
}: {
  category: Category;
  parts: readonly BuildPartResponse[];
  notNeeded: boolean;
  refused: Refusal | undefined;
}) {
  const [language, t, categoryName] = await Promise.all([
    getLocale(),
    getTranslations('BuildPage'),
    getTranslations('Category'),
  ]);
  const place = placeOf(category);
  const heading = `${place}-heading`;
  const picker = pickerAddress(language, category);
  const most = { most: formatNumber(mostOfOne), least: formatNumber(1) };
  // Under a stacked line its controls start under its picture: the start
  // of its words is past the square, 40 pixels on a phone and 48 from 48rem,
  // and its margin.
  const fromTheWords = 'ps-[3.25rem] md:ps-[3.75rem]';

  return (
    <li
      id={place}
      data-space={category}
      data-testid={`build-category-${category}`}
      className="@container grid scroll-mt-6 grid-cols-[minmax(0,1fr)] gap-2"
    >
      <h3
        id={heading}
        tabIndex={-1}
        className="flex items-center gap-2 text-base font-semibold text-muted-foreground"
      >
        <CategoryIcon category={category} size={20} className="shrink-0" />
        <span>{categoryName(category)}</span>
      </h3>

      {parts.map((part) => (
        <div
          key={part.id}
          data-line={`part-${part.id}`}
          data-testid="build-part"
          data-part={part.id}
          className="grid grid-cols-[minmax(0,1fr)] gap-1"
        >
          <ul className="@container grid grid-cols-[minmax(0,1fr)]">
            <Item
              picture={<PartSquare part={part} />}
              name={
                part.visible ? (
                  <a href={partAddress(language, part.id)} className="hover-underline">
                    <AlwaysEnglish>{part.name}</AlwaysEnglish>
                  </a>
                ) : (
                  <AlwaysEnglish>{part.name}</AlwaysEnglish>
                )
              }
              second={<AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>}
            />
          </ul>
          <div
            data-controls=""
            className={cn(
              'flex flex-wrap items-center justify-between gap-x-6 gap-y-1',
              fromTheWords,
            )}
          >
            {part.quantity === null ? (
              <a
                href={picker}
                aria-label={t('changeThe', { category })}
                className={underlinedAction}
              >
                {t('change')}
              </a>
            ) : (
              <QuantityForm
                action={`/${language}/build/quantity`}
                part={part.id}
                quantity={part.quantity}
                refused={
                  refused === undefined || !('part' in refused) || refused.part !== part.id
                    ? undefined
                    : refused.reason === 'mostOfOne'
                      ? t('refused.mostOfOne', most)
                      : t('refused.notAQuantity', most)
                }
                words={{
                  label: t('quantity.of', { part: part.name }),
                  figure: t('quantity.figure'),
                  oneFewer: t('quantity.oneFewer'),
                  oneMore: t('quantity.oneMore'),
                  set: t('quantity.set'),
                  notAQuantity: t('refused.notAQuantity', most),
                }}
              />
            )}
            <RemoveForm
              action={`/${language}/build/remove`}
              part={part.id}
              line={`part-${part.id}`}
              focusAfter={heading}
              label={t('removeThe', { part: part.name })}
            >
              {t('remove')}
            </RemoveForm>
          </div>
        </div>
      ))}

      {isKitOrDrive(category) && parts.length > 0 && parts.length < mostKitsOrDrives && (
        <a
          href={picker}
          data-controls=""
          className={cn(underlinedAction, 'justify-self-start', fromTheWords)}
        >
          {t('addAnother', { category })}
        </a>
      )}

      {refused?.reason === 'mostKitsOrDrives' && refused.category === category && (
        <p data-testid="refused" data-controls="" className={cn('text-base', fromTheWords)}>
          {t('refused.mostKitsOrDrives', {
            category,
            most: formatNumber(mostKitsOrDrives),
          })}
        </p>
      )}

      {parts.length === 0 &&
        (notNeeded ? (
          <div
            data-line={`not-needed-${category}`}
            data-testid="not-needed"
            className="grid grid-cols-[minmax(0,1fr)] gap-1 ps-7"
          >
            <p className="text-base text-muted-foreground">
              {t('notNeeded', { category })}
            </p>
            <a href={picker} className={cn(underlinedAction, 'justify-self-start')}>
              {t('choose', { category })}
            </a>
          </div>
        ) : (
          <div data-line={`choose-${category}`} className="grid grid-cols-[minmax(0,1fr)]">
            <a
              href={picker}
              data-testid="choose"
              className={buttonVariants({ kind: 'board', className: 'w-full' })}
            >
              {t('choose', { category })}
            </a>
          </div>
        ))}
    </li>
  );
}
