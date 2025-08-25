// components/ui/Select.jsx
import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/helpers';

const Select = ({ children, value, onValueChange, disabled = false, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const handleSelect = (val) => {
    setSelectedValue(val);
    if (onValueChange) onValueChange(val);
    setIsOpen(false);
  };

  return (
    <div className="relative" {...props}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          isOpen, 
          setIsOpen, 
          selectedValue, 
          handleSelect,
          disabled
        })
      )}
    </div>
  );
};

const SelectTrigger = React.forwardRef(({ 
  className, 
  children, 
  isOpen, 
  setIsOpen, 
  disabled = false,
  error = false,
  ...props 
}, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-2xl border bg-white/80 backdrop-blur-sm px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900/80 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400",
      error 
        ? "border-red-300 focus:ring-red-500 dark:border-red-700" 
        : "border-neutral-200 dark:border-neutral-700",
      className
    )}
    onClick={() => !disabled && setIsOpen(!isOpen)}
    disabled={disabled}
    {...props}
  >
    {children}
    <ChevronDown className={cn(
      "h-4 w-4 opacity-50 transition-transform duration-200",
      isOpen && "rotate-180"
    )} />
  </button>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder, selectedValue, displayValue }) => {
  return (
    <span className={cn(
      selectedValue ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500"
    )}>
      {displayValue || selectedValue || placeholder}
    </span>
  );
};

const SelectContent = ({ className, children, isOpen, ...props }) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute top-full left-0 z-50 mt-1 max-h-96 w-full overflow-auto rounded-2xl border border-neutral-200/50 bg-white/95 backdrop-blur-lg py-1 text-neutral-950 shadow-2xl dark:border-neutral-700/50 dark:bg-neutral-900/95 dark:text-neutral-50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const SelectItem = ({ 
  className, 
  children, 
  value, 
  handleSelect, 
  selectedValue,
  disabled = false,
  ...props 
}) => {
  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none transition-colors",
        disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "hover:bg-neutral-100/80 focus:bg-neutral-100/80 dark:hover:bg-neutral-800/80 dark:focus:bg-neutral-800/80",
        selectedValue === value && "bg-neutral-100 dark:bg-neutral-800",
        className
      )}
      onClick={() => !disabled && handleSelect(value)}
      {...props}
    >
      {selectedValue === value && (
        <Check className="absolute left-2 h-4 w-4 text-blue-600" />
      )}
      {children}
    </div>
  );
};

const SelectSeparator = ({ className, ...props }) => (
  <div
    className={cn("my-1 h-px bg-neutral-200 dark:bg-neutral-700", className)}
    {...props}
  />
);

const SelectGroup = ({ className, children, ...props }) => (
  <div className={cn("py-1", className)} {...props}>
    {children}
  </div>
);

const SelectLabel = ({ className, ...props }) => (
  <div
    className={cn("px-2 py-1.5 text-xs font-semibold text-neutral-500", className)}
    {...props}
  />
);

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};