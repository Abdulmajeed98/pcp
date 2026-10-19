// The words of a search of Parts, as the catalog search reads them: a term is
// split into words at spaces, and a Part is found when it holds every word, in
// any order. An empty term has no words, and finds every Part. Every search of
// Parts, a Vendor's own Offers among them, reads its term this way.
export function searchWordsOf(term: string): string[] {
  return term.split(/\s+/).filter((word) => word !== '');
}
