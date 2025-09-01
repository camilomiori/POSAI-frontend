import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Zap 
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { NOTIFICATION_TYPES } from '../../utils/constants';

// Individual Toast Component
export const Toast = ({ 
  id,
  type = NOTIFICATION_TYPES.INFO,
  message,
  duration = 3000,
  onRemove,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleExit();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case NOTIFICATION_TYPES.ERROR:
        return <XCircle className="w-5 h-5 text-red-600" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case NOTIFICATION_TYPES.AI:
        return <Zap className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    const base = "border shadow-lg backdrop-blur-sm";
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return `${base} bg-green-50/95 border-green-200 text-green-800`;
      case NOTIFICATION_TYPES.ERROR:
        return `${base} bg-red-50/95 border-red-200 text-red-800`;
      case NOTIFICATION_TYPES.WARNING:
        return `${base} bg-orange-50/95 border-orange-200 text-orange-800`;
      case NOTIFICATION_TYPES.AI:
        return `${base} bg-emerald-50/95 border-emerald-200 text-emerald-800`;
      default:
        return `${base} bg-blue-50/95 border-blue-200 text-blue-800`;
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-2xl transition-all duration-300 ease-in-out max-w-sm w-full",
        getStyles(),
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isExiting && 'translate-x-full opacity-0 scale-95',
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">
          {message}
        </p>
      </div>

      <button
        onClick={handleExit}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded-lg transition-colors duration-200 -mt-1 -mr-1"
        aria-label="Cerrar notificaci�n"
      >
        <X className="w-4 h-4 opacity-60 hover:opacity-100" />
      </button>
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts = [], onRemove, position = 'top-right' }) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (!toasts.length) return null;

  return (
    <div 
      className={cn(
        "fixed z-50 flex flex-col gap-2",
        getPositionClasses()
      )}
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ 
            zIndex: toasts.length - index,
            animationDelay: `${index * 100}ms`
          }}
        >
          <Toast
            {...toast}
            onRemove={onRemove}
          />
        </div>
      ))}
    </div>
  );
};

// Toast Provider Hook Context
const ToastContext = React.createContext();

// Toast Provider Component
const ToastProvider = ({ children, position = 'top-right', maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = NOTIFICATION_TYPES.INFO, duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now()
    };

    setToasts(prev => {
      const newToasts = [toast, ...prev];
      // Limit number of toasts
      return newToasts.slice(0, maxToasts);
    });

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  // Convenience methods
  const success = (message, duration = 3000) => 
    addToast(message, NOTIFICATION_TYPES.SUCCESS, duration);
  
  const error = (message, duration = 5000) => 
    addToast(message, NOTIFICATION_TYPES.ERROR, duration);
  
  const warning = (message, duration = 4000) => 
    addToast(message, NOTIFICATION_TYPES.WARNING, duration);
  
  const info = (message, duration = 3000) => 
    addToast(message, NOTIFICATION_TYPES.INFO, duration);
  
  const ai = (message, duration = 4000) => 
    addToast(message, NOTIFICATION_TYPES.AI, duration);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
    ai
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        onRemove={removeToast} 
        position={position}
      />
    </ToastContext.Provider>
  );
};

// Hook to use toast context
const useToastContext = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

// Pre-configured toast functions for common use cases
const showSuccessToast = (message) => {
  // This would use the context or a global toast system
  if (import.meta.env.DEV) {
    console.log('Success:', message);
  }
};

const showErrorToast = (message) => {
  // This would use the context or a global toast system
  if (import.meta.env.DEV) {
    console.log('Error:', message);
  }
};

const showWarningToast = (message) => {
  // This would use the context or a global toast system
  if (import.meta.env.DEV) {
    console.log('Warning:', message);
  }
};

const showInfoToast = (message) => {
  // This would use the context or a global toast system
  if (import.meta.env.DEV) {
    console.log('Info:', message);
  }
};

const showAIToast = (message) => {
  // This would use the context or a global toast system
  if (import.meta.env.DEV) {
    console.log('AI:', message);
  }
};

export {
  ToastContainer,
  ToastProvider,
  useToastContext,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showAIToast
};