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
        "peer h-4 w-4 shrink-0 rounded border border-gray-300 ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-blue-400",
        (checked || indeterminate) && "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm",
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