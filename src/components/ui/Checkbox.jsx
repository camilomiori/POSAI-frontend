// components/ui/Checkbox.jsx
import React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../utils/helpers';

const Checkbox = React.forwardRef(({ 
  className, 
  checked = false, 
  onCheckedChange,
  disabled = false,
  indeterminate = false,
  id,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      data-state={indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-neutral-200 ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:ring-offset-neutral-950",
        (checked || indeterminate) && "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent",
        className
      )}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      disabled={disabled}
      {...props}
    >
      {indeterminate ? (
        <Minus className="h-4 w-4" />
      ) : checked ? (
        <Check className="h-4 w-4" />
      ) : null}
    </button>
  );
});

Checkbox.displayName = "Checkbox";

export default Checkbox;