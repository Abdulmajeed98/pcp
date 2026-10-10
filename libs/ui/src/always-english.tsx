import type { ComponentProps } from 'react';

// Marks text that is in English and runs left to right in every language: a
// Part name, a manufacturer name, a specification, and a number with its unit
// or its currency (LANG-3).
//
// Inside a Kurdish or an Arabic sentence the browser otherwise reorders the
// pieces of such text: "Ryzen 5 7600" is drawn as "7600 5 Ryzen", and a
// number changes places with its unit. This gives the text a left-to-right
// direction of its own and keeps it apart from the sentence around it, so
// that neither reorders the other. It does so with HTML's own means: `bdi`
// is the element for text to be kept apart, and `dir` gives it its direction.
// It also says that the text is English, for a screen reader's voice.
//
// It has no styling. Such text is never in the language files.
export function AlwaysEnglish(props: Omit<ComponentProps<'bdi'>, 'dir' | 'lang'>) {
  return <bdi {...props} dir="ltr" lang="en" />;
}
