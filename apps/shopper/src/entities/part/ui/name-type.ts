// The type a Part's name is set in where it is the Sheet title, on the
// square plate and the box label (DESIGN.md's The Long Name Rule): the Sheet
// title while it is short, the Facts size past 40 characters and the Title
// size past 80, so that the catalog's longest name, 276 characters, reads as
// a paragraph and never as a poster. The name is English in every language
// (LANG-3), so its element says so, and keeps the Latin setting of the
// display face on a Kurdish or an Arabic page.
export function nameType(name: string): string {
  if (name.length > 80) return 'text-xl font-semibold';
  if (name.length > 40) return 'type-facts';
  return 'type-sheet-title';
}
