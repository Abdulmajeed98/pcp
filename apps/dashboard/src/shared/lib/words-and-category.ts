// A search's words and the one Category it was narrowed to, if any, as an
// address's query holds them: `?search=ryzen&category=cpu`, as the Vendor
// portal's catalog search writes them and the Part Request form opened from
// it reads them. The API refuses a Category it does not have, and the screen
// says so, so the address's Category is taken as it is.
export interface WordsAndCategory<Category extends string> {
  words: string;
  category?: Category;
}

// The words and the Category an address's query holds, the words as they
// are written there.
export function wordsAndCategoryIn<Category extends string>(
  params: URLSearchParams,
): WordsAndCategory<Category> {
  return {
    words: params.get('search') ?? '',
    category: (params.get('category') || undefined) as Category | undefined,
  };
}

// Writes the words, trimmed, and the Category into an address's query,
// leaving out words of nothing but spaces.
export function writeWordsAndCategoryInto(
  params: URLSearchParams,
  { words, category }: WordsAndCategory<string>,
): void {
  if (words.trim() !== '') params.set('search', words.trim());
  if (category !== undefined) params.set('category', category);
}

// A query that holds the words and the Category alone, to lead from the
// catalog search to the Part Request form, or back.
export function queryOfWordsAndCategory(search: WordsAndCategory<string>): string {
  const params = new URLSearchParams();
  writeWordsAndCategoryInto(params, search);
  return `?${params.toString()}`;
}
