import React from 'react';
import { cn } from '../../utils/helpers';

const Button = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  disabled = false,
  loading = false,
  children, 
  ...props 
}, ref) => {
  const variants = {
    default: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg",
    outline: "border border-neutral-200 bg-white/80 backdrop-blur-sm hover:bg-neutral-50",
    ai: "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 shadow-lg",
  };
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3 text-sm", 
    lg: "h-11 px-8",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-medium transition-all duration-200 focus-visible:outline-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;