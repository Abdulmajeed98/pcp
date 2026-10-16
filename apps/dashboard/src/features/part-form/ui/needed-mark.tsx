// The mark of a needed specification: one a Compatibility Rule reads. It is
// said in words, and a control names it as part of its description, so a
// screen reader says it with the field.
export function NeededMark({ id }: { id: string }) {
  return (
    <span
      id={id}
      className="rounded-sm bg-secondary px-1.5 text-sm font-medium text-secondary-foreground"
    >
      Needed
    </span>
  );
}
