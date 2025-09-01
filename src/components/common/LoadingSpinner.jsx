import React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '../../utils/helpers';

export const LoadingSpinner = ({ 
  size = 'default',
  variant = 'default', 
  text = '',
  fullscreen = false,
  className = ''
}) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variants = {
    default: 'text-blue-600',
    ai: 'text-emerald-500',
    white: 'text-white',
    gray: 'text-gray-400',
    primary: 'text-blue-600'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    default: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const SpinnerIcon = variant === 'ai' ? Zap : Loader2;

  const spinner = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      className
    )}>
      <SpinnerIcon 
        className={cn(
          sizes[size],
          variants[variant],
          "animate-spin"
        )}
      />
      {text && (
        <p className={cn(
          textSizes[size],
          variants[variant],
          "font-medium animate-pulse"
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl border border-neutral-200/50 shadow-2xl p-8">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

// Pre-configured spinner components for common use cases
const PageLoadingSpinner = ({ text = "Cargando p�gina..." }) => (
  <LoadingSpinner 
    size="lg" 
    text={text} 
    fullscreen 
    className="text-blue-600"
  />
);

const AILoadingSpinner = ({ text = "IA procesando..." }) => (
  <LoadingSpinner 
    size="default" 
    variant="ai" 
    text={text}
    className="text-emerald-500"
  />
);

const ButtonLoadingSpinner = ({ size = "sm" }) => (
  <LoadingSpinner 
    size={size} 
    variant="white"
    className="text-white"
  />
);

const CardLoadingSpinner = ({ text = "Cargando datos..." }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 shadow-lg p-8">
    <LoadingSpinner 
      size="default" 
      text={text}
      className="text-gray-600"
    />
  </div>
);

// Loading skeleton components
const ProductCardSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 shadow-lg p-4">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="flex justify-between items-center mb-3">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const TableRowSkeleton = ({ columns = 4 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
    ))}
  </tr>
);

const ChartSkeleton = ({ height = 300 }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 shadow-lg p-6">
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
      
      <div 
        className="bg-gray-100 rounded-lg flex items-end justify-center gap-2 px-4 py-8"
        style={{ height: height }}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-gray-200 rounded"
            style={{
              width: '20px',
              height: `${Math.random() * 80 + 20}%`
            }}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// Default export
export default LoadingSpinner;

// Export all components
export {
  PageLoadingSpinner,
  AILoadingSpinner,
  ButtonLoadingSpinner,
  CardLoadingSpinner,
  ProductCardSkeleton,
  TableRowSkeleton,
  ChartSkeleton
};