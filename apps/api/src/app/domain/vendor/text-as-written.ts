// Whether a detail kept as it was written was given at all: a text that holds
// more than spaces and line breaks.
export function holdsText(text: string | null): text is string {
  return text !== null && /\S/.test(text);
}

// A text's length in characters, each Unicode code point counting as one, as
// JSON Schema's maxLength counts them.
export function lengthOf(text: string): number {
  return [...text].length;
}
