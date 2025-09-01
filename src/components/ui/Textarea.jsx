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
        "flex min-h-[80px] w-full rounded-2xl border bg-white/95 backdrop-blur-sm px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error 
          ? "border-red-300 focus-visible:ring-red-500" 
          : "border-blue-200",
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