// components/ui/Dialog.jsx
import React, { useEffect } from 'react';
import { cn } from '../../utils/helpers';

const Dialog = ({ children, open, onOpenChange }) => {
  useEffect(() => {
    const onKey = (e) => { 
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 max-h-[85vh] w-full max-w-lg overflow-auto bg-white/95 backdrop-blur-lg dark:bg-neutral-900/95 rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-2xl">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ className, children, ...props }) => {
  return (
    <div className={cn("grid gap-4 p-6", className)} {...props}>
      {children}
    </div>
  );
};

const DialogHeader = ({ className, ...props }) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
  );
};

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({ className, ...props }) => {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4", className)} {...props} />
  );
};

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};