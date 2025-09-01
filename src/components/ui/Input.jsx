// components/ui/Input.jsx
import React from 'react';
import { cn } from '../../utils/helpers';

const Input = React.forwardRef(({ 
  className, 
  type = "text", 
  error = false,
  icon,
  suffix,
  ...props 
}, ref) => {
  const baseClasses = cn(
    "flex h-10 w-full rounded-2xl border bg-white/95 backdrop-blur-sm px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    error 
      ? "border-red-300 focus-visible:ring-red-500" 
      : "border-blue-200",
    icon && "pl-10",
    suffix && "pr-10",
    className
  );

  if (icon || suffix) {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={baseClasses}
          ref={ref}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            {suffix}
          </div>
        )}
      </div>
    );
  }

  return (
    <input
      type={type}
      className={baseClasses}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;