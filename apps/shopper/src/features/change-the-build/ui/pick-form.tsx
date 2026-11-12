import type { Category } from '@/entities/build';
import { buttonVariants } from '@/shared/ui';

// Pick (DESIGN.md's A Part in the picker): a plain form, sent with POST to
// `/<language>/build/pick` with the Category and the Part, that puts the Part
// in the Build. For a CPU, CPU cooler, motherboard, GPU, case or PSU it
// replaces the Build's Part of that Category; a RAM kit or a drive joins the
// others, or is counted once more when the Build holds it ("Add one more").
// It is answered with the Build page at the Category's place, shown printed,
// with script and without, so it works before any script has loaded.
//
// Its button is a cell of the Board, 44 pixels tall, named for a screen
// reader by the Part it picks, "Pick AMD Ryzen 5 7600X"; it takes a tap at
// once, its pressed ground and the press (Motion 8), and shows no long-press
// menu nor selects its words.
export function PickForm({
  action,
  category,
  part,
  label,
  children,
}: {
  action: string;
  category: Category;
  part: string;
  label: string;
  children: string;
}) {
  return (
    <form action={action} method="post">
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="part" value={part} />
      <button
        type="submit"
        aria-label={label}
        data-testid="pick"
        className={buttonVariants({ kind: 'board', className: 'min-h-control px-4' })}
      >
        {children}
      </button>
    </form>
  );
}
