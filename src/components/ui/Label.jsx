// components/ui/Label.jsx
import React from 'react';
import { cn } from '../../utils/helpers';

const Label = React.forwardRef(({ 
  className, 
  required = false,
  error = false,
  ...props 
}, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      error && "text-red-600 dark:text-red-400",
      className
    )}
    {...props}
  >
    {props.children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
));

Label.displayName = "Label";

export default Label;