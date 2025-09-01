// components/ui/Select.jsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/helpers';

const Select = React.forwardRef(({ 
  className, 
  children,
  error = false,
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar...",
  ...props 
}, ref) => {
  
  // Si se pasan opciones, usar el componente avanzado
  if (options && options.length > 0) {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error 
            ? "border-red-300 focus-visible:ring-red-500" 
            : "border-gray-300 hover:border-gray-400",
          className
        )}
        ref={ref}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  // Componente select básico con children
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error 
          ? "border-red-300 focus-visible:ring-red-500" 
          : "border-gray-300 hover:border-gray-400",
        className
      )}
      ref={ref}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = "Select";

export default Select;