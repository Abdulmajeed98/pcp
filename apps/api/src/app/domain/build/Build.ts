import { NotValidError } from '@pcp/core';
import { Either } from 'effect';

import { Category } from '../part/Category';
import { Part } from '../part/Part';
import { partNotValid } from './build-errors';

// The Categories a Build holds several of, each with a quantity: RAM kits
// and drives. It holds at most one Part of each other Category (BLD-1).
const countedCategories: readonly Category[] = [Category.RAM, Category.STORAGE];

// The limits that keep a Build small enough for the Shopper's browser to
// keep: at most 8 different RAM kits and 8 different drives, each from 1 to
// 16 of it.
export const MOST_DIFFERENT_KITS_OR_DRIVES = 8;
export const MOST_OF_ONE_KIT_OR_DRIVE = 16;

// One Part of a Build, as the catalog holds it: its quantity, when it is a
// RAM kit or a drive, and whether it is a Visible Part at the moment the
// Build was read.
export class BuildPart {
  constructor(
    private readonly part: Part,
    private readonly quantity: number | undefined,
    private readonly visible: boolean,
  ) {}

  getPart(): Part {
    return this.part;
  }

  // How many of it the Build holds, from 1 to 16, for a RAM kit or a drive;
  // none for a Part of a Category a Build holds one of.
  getQuantity(): number | undefined {
    return this.quantity;
  }

  // Whether it is a Visible Part, a Part with at least one Visible Offer. A
  // Part that is not stays in the Build.
  isVisible(): boolean {
    return this.visible;
  }
}

// The place of a Part's Category among the eight, in the catalog's order.
function placeOf(part: BuildPart): number {
  return Category.values().indexOf(part.getPart().getCategory());
}

// A Shopper's chosen set of Parts intended to make one PC (BLD-1).
export class Build {
  private constructor(private readonly parts: readonly BuildPart[]) {}

  // The Build of these Parts, given in the Build's order, or the refusal,
  // naming `part`, of the first Part a Build cannot hold so: a quantity on a
  // Part of a Category it holds one of, and none on a RAM kit or a drive; a
  // second Part of a Category it holds one of; and then more different RAM
  // kits, or drives, than the limit.
  static of(parts: readonly BuildPart[]): Either.Either<Build, NotValidError> {
    for (const [place, part] of parts.entries()) {
      const category = part.getPart().getCategory();
      const counted = countedCategories.includes(category);
      if (
        !counted &&
        parts.slice(0, place).some((before) => before.getPart().getCategory() === category)
      ) {
        return Either.left(
          partNotValid('twoOfACategory', 'A Build holds two Parts of a Category of one'),
        );
      }
      if (!counted && part.getQuantity() !== undefined) {
        return Either.left(
          partNotValid('quantityGiven', "A Build's Part has a quantity it cannot hold"),
        );
      }
      if (counted && part.getQuantity() === undefined) {
        return Either.left(
          partNotValid('quantityMissing', "A Build's RAM kit or drive has no quantity"),
        );
      }
    }
    for (const category of countedCategories) {
      const different = parts.filter((part) => part.getPart().getCategory() === category);
      if (different.length > MOST_DIFFERENT_KITS_OR_DRIVES) {
        return Either.left(
          partNotValid(
            'tooMany',
            'A Build holds more different kits or drives than it may',
          ),
        );
      }
    }
    return Either.right(
      new Build([...parts].sort((one, other) => placeOf(one) - placeOf(other))),
    );
  }

  // Its Parts in the catalog's order of Categories, and the RAM kits and
  // drives in the Build's order, as a sort that keeps ties in place gives
  // them.
  getParts(): readonly BuildPart[] {
    return this.parts;
  }

  // Whether it holds a Part of the Category.
  holds(category: Category): boolean {
    return this.parts.some((each) => each.getPart().getCategory() === category);
  }
}
