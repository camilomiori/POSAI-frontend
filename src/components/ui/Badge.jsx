// components/ui/Badge.jsx
import React from 'react';
import { cn } from '../../utils/helpers';

const Badge = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default",
  ...props 
}, ref) => {
  const variants = {
    default: "border-transparent bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg",
    secondary: "border-transparent bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-900 dark:from-neutral-700 dark:to-neutral-800 dark:text-neutral-100",
    destructive: "border-transparent bg-gradient-to-r from-red-500 to-red-600 text-white",
    outline: "text-neutral-950 border-neutral-200 dark:text-neutral-50 dark:border-neutral-700",
    success: "border-transparent bg-gradient-to-r from-emerald-500 to-green-500 text-white",
    warning: "border-transparent bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
    ai: "border-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg",
    info: "border-transparent bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
  };

  const sizes = {
    default: "px-2.5 py-0.5 text-xs",
    sm: "px-2 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export default Badge;