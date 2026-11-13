import { cookies } from 'next/headers';

import {
  type Build,
  buildIn,
  type Category,
  type Changed,
  changeTheQuantity,
  isCategory,
  pickInto,
  rememberTheBuild,
  removeFrom,
} from '@/entities/build';
import { addressAfterAChange } from '@/features/change-the-build';

import { readTheBuildToChange } from '../api/read-the-build-to-change';
import { answerAForm } from './answer-a-form';

// What a form that changes the Build does to it, from what the form sends:
// the change, and the Category it changed, whose place on the Build page the
// answer leads to.
type AChange = (build: Build, form: FormData) => { changed: Changed; at?: Category };

// A form that changes the Build, sent with POST to its address under
// `/<language>/build/`: the change applies to the Build as the catalog holds
// it, which forgets the Parts it no longer holds (`readTheBuildToChange`);
// the answer writes the changed Build into the browser for a year, as the
// switches' answers write their choice, and sends the Shopper to the Build
// page, at the place of the Category it changed, which the server draws
// anew from the cookie. A change past the limits is not applied, the Build
// kept as its cookie holds it, and the address says why. `answerAForm` says
// how the answer is made.
function answerAChange(change: AChange) {
  return answerAForm(async (language, form) => {
    const build = await readTheBuildToChange(buildIn(await cookies()));
    const { changed, at } = change(build, form);
    const refused = 'refused' in changed ? changed.refused : undefined;
    return {
      address: addressAfterAChange(language, { at, refused }),
      write:
        'build' in changed
          ? (response) => rememberTheBuild(response, changed.build)
          : undefined,
    };
  });
}

// A field of the form, as text: what is not text, as a file, is none.
function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

// The Category of the Build's Part a form names, for the place the answer
// leads to.
function categoryOf(build: Build, part: string): Category | undefined {
  return build.find((each) => each.part === part.toLowerCase())?.category;
}

// `POST /<language>/build/pick`: a Category and a Part, which the picker's
// Pick sends (builder ticket 09). It replaces the Build's Part of a Category
// that holds one, and adds a kit or a drive, or counts it once more.
export const pickAPart = answerAChange((build, form) => {
  const category = field(form, 'category');
  return {
    changed: pickInto(build, category, field(form, 'part')),
    at: isCategory(category) ? category : undefined,
  };
});

// `POST /<language>/build/quantity`: a kit's or a drive's Part and its
// quantity, sent by − or + (`quantity`), or typed in the figure between them
// (`typed`), which the form's first button, out of sight, sends when Enter or
// the number pad's Done is pressed.
export const changeAQuantity = answerAChange((build, form) => {
  const part = field(form, 'part');
  const sent = form.has('quantity') ? field(form, 'quantity') : field(form, 'typed');
  return { changed: changeTheQuantity(build, part, sent), at: categoryOf(build, part) };
});

// `POST /<language>/build/remove`: a Part, taken out of the Build.
export const removeAPart = answerAChange((build, form) => {
  const part = field(form, 'part');
  return { changed: { build: removeFrom(build, part) }, at: categoryOf(build, part) };
});

// `POST /<language>/build/empty`: the Build emptied, which its one
// confirmation sends, whatever it held, so it is not read first. The answer
// opens the empty Build from its top.
export const emptyTheBuild = answerAForm((language) => ({
  address: addressAfterAChange(language, {}),
  write: (response) => rememberTheBuild(response, []),
}));
