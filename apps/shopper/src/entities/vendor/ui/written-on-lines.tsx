import { AsWritten } from '@pcp/ui';
import { cn } from 'cn';

// Text a Vendor wrote on one or more lines, its address or its opening
// hours, kept on its lines and in its own direction, so that a Kurdish
// address is laid out right to left on an English page (LANG-4). Each line
// takes its own direction too, as a phone's messages do, so that an English
// line of a Kurdish address, such as a landmark's name, starts on the left.
// Its digits are the Vendor's own, as it wrote them.
//
// The text stays one isolated piece, in the direction of its first letter;
// inside it, `unicode-bidi: plaintext` gives each line, a paragraph of its
// own, its own direction and aligns it to its own start.
export function WrittenOnLines({
  text,
  className,
  testId,
}: {
  text: string;
  className?: string;
  testId?: string;
}) {
  return (
    <AsWritten data-testid={testId} className={cn('block whitespace-pre-line', className)}>
      <span className="block [unicode-bidi:plaintext]">{text}</span>
    </AsWritten>
  );
}
