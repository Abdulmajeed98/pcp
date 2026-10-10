import type { ComponentProps } from 'react';

// Marks text that is in English and runs left to right in every language: a
// Part name, a manufacturer name and a specification (LANG-3), and a number
// with its unit or its currency.
//
// Inside a Kurdish or an Arabic sentence the browser otherwise reorders the
// pieces of such text when it starts with a number: "80 mm" is drawn as
// "mm 80", "990 PRO 2TB" as "PRO 2TB 990", and a price on the far side of its
// currency. A name that starts with a letter, such as "Ryzen 5 7600", happens
// to be left whole. This gives the text a left-to-right direction of its own
// and keeps it apart from the sentence around it, so that neither reorders
// the other. It does so with HTML's own means: `bdi` is the element for text
// to be kept apart, and `dir` gives it its direction. It also says that the
// text is English, for a screen reader's voice.
//
// It has no styling. Such text is never in the language files.
export function AlwaysEnglish(props: Omit<ComponentProps<'bdi'>, 'dir' | 'lang'>) {
  return <bdi {...props} dir="ltr" lang="en" />;
}
