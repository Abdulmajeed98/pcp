import { Button } from './button';
import { Empty, EmptyHeader, EmptyTitle } from './empty';

// What a list answered in pages shows at an address that asks for a page past
// the last, as when the list has shrunk since the address was written, with
// the way to its first page. Its words are the Admin console's, in English,
// unless a screen of the Vendor portal gives its own, in the portal's
// language.
function PastTheLastPage({
  onFirstPage,
  words,
}: {
  onFirstPage: () => void;
  words?: { title: string; firstPage: string };
}) {
  return (
    <Empty className="border-y border-border">
      <EmptyHeader>
        <EmptyTitle>{words?.title ?? 'This page is past the last one.'}</EmptyTitle>
      </EmptyHeader>
      <Button variant="outline" onClick={onFirstPage}>
        {words?.firstPage ?? 'Go to the first page'}
      </Button>
    </Empty>
  );
}

export { PastTheLastPage };
