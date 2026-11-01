import { cn } from 'cn';
import type * as React from 'react';

import { Textarea } from '@/shared/ui';

// A Part's name, as the owner chose on 22 October 2026 ("Field that grows",
// redesign ticket 08): the field wraps and grows, so that a long name, such
// as a cooler's of 276 characters, is seen whole while it is edited. It is as
// high as a control while the name fits one line. The name is one line of
// text all the same: Enter sends the form, as it does in a one-line field,
// and a line break pasted into it becomes a space.
export function NameField({
  onChange,
  onKeyDown,
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <Textarea
      rows={1}
      autoComplete="off"
      enterKeyHint="done"
      className={cn(
        'min-h-control py-[calc((var(--spacing-control)-1.625rem)/2)]',
        className,
      )}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }
        onKeyDown?.(event);
      }}
      onChange={(event) => {
        const field = event.currentTarget;
        if (/[\r\n]/.test(field.value)) {
          field.value = field.value.replace(/\s*[\r\n]+\s*/g, ' ');
        }
        onChange?.(event);
      }}
      {...props}
    />
  );
}
