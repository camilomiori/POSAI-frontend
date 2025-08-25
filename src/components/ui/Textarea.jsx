// components/ui/Textarea.jsx
import React from 'react';
import { cn } from '../../utils/helpers';

const Textarea = React.forwardRef(({ 
  className, 
  error = false,
  resize = true,
  ...props 
}, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-2xl border bg-white/80 backdrop-blur-sm px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900/80 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400",
        error 
          ? "border-red-300 focus-visible:ring-red-500 dark:border-red-700" 
          : "border-neutral-200 dark:border-neutral-700",
        !resize && "resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export default Textarea;