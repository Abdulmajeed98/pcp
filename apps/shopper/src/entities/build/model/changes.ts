import { westernNumberIn } from '@pcp/i18n';

import { identifierIn } from '@/shared/lib';

import {
  type Build,
  type BuildPart,
  isCategory,
  isKitOrDrive,
  type KitOrDrive,
  mostKitsOrDrives,
  mostOfOne,
  quantityIn,
} from './build';

// Why a change to the Build was not applied: it would take the Build past
// its limits, 8 different kits or drives of a Category, or 16 of one, or the
// quantity sent is not one from 1 to 16. The Build page says why.
export type Refusal =
  | { reason: 'mostKitsOrDrives'; category: KitOrDrive }
  | { reason: 'mostOfOne'; category: KitOrDrive; part: string }
  | { reason: 'notAQuantity'; category: KitOrDrive; part: string };

// A change to the Build: the Build it gives, or why it was not applied, the
// Build then kept as it was.
export type Changed = { build: Build } | { refused: Refusal };

// A pick, as the pick form sends it: a Category and a Part (BLD-1). For a
// Category that holds one, the Part replaces the Build's Part of it, in its
// place, or joins the Build. A RAM kit or a drive joins the others with a
// quantity of one, or is counted once more when the Build holds it. A pick
// past the limits is refused, and says why. A Category or a Part that is not
// one, and a Part the Build holds under another Category, which only a form
// changed by hand sends, leave the Build as it is.
export function pickInto(build: Build, categoryText: string, partText: string): Changed {
  const part = identifierIn(partText);
  if (!isCategory(categoryText) || part === undefined) return { build };
  const category = categoryText;
  const held = build.find((each) => each.part === part);
  if (held !== undefined && held.category !== category) return { build };

  if (!isKitOrDrive(category)) {
    const picked: BuildPart = { category, part };
    return build.some((each) => each.category === category)
      ? { build: build.map((each) => (each.category === category ? picked : each)) }
      : { build: [...build, picked] };
  }

  if (held !== undefined && 'quantity' in held) {
    return held.quantity >= mostOfOne
      ? { refused: { reason: 'mostOfOne', category, part } }
      : { build: withQuantity(build, part, held.quantity + 1) };
  }
  return build.filter((each) => each.category === category).length >= mostKitsOrDrives
    ? { refused: { reason: 'mostKitsOrDrives', category } }
    : { build: [...build, { category, part, quantity: 1 }] };
}

// A change of a kit's or a drive's quantity, as the quantity form sends it:
// typed on the phone's number pad, in Western, Arabic-Indic or Eastern
// Arabic-Indic digits, or sent by − and +. A quantity that is not a whole
// number from 1 to 16 is refused, and says why; Remove is the way to none. A
// Part the Build does not hold as a kit or a drive leaves it as it is.
export function changeTheQuantity(build: Build, partText: string, typed: string): Changed {
  const held = build.find((each) => each.part === identifierIn(partText));
  if (held === undefined || !('quantity' in held)) return { build };

  const quantity = typedQuantityIn(typed);
  return quantity === undefined
    ? { refused: { reason: 'notAQuantity', category: held.category, part: held.part } }
    : { build: withQuantity(build, held.part, quantity) };
}

// A quantity as a Shopper types it on the phone's number pad, in Western,
// Arabic-Indic or Eastern Arabic-Indic digits, with spaces or a thousands
// separator dropped: a whole number from 1 to 16, or none.
export function typedQuantityIn(typed: string): number | undefined {
  return quantityIn(westernNumberIn(typed));
}

// The Build without a Part, the rest kept in their order.
export function removeFrom(build: Build, partText: string): Build {
  const part = identifierIn(partText);
  return build.some((each) => each.part === part)
    ? build.filter((each) => each.part !== part)
    : build;
}

function withQuantity(build: Build, part: string, quantity: number): Build {
  return build.map((each) =>
    each.part === part && 'quantity' in each ? { ...each, quantity } : each,
  );
}
