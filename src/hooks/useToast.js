// hooks/useToast.js
import { useState, useCallback } from 'react';
import { NOTIFICATION_TYPES } from '../utils/constants';

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now()
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different toast types
  const success = useCallback((message, duration = 3000) => {
    return addToast(message, NOTIFICATION_TYPES.SUCCESS, duration);
  }, [addToast]);

  const error = useCallback((message, duration = 5000) => {
    return addToast(message, NOTIFICATION_TYPES.ERROR, duration);
  }, [addToast]);

  const warning = useCallback((message, duration = 4000) => {
    return addToast(message, NOTIFICATION_TYPES.WARNING, duration);
  }, [addToast]);

  const info = useCallback((message, duration = 3000) => {
    return addToast(message, NOTIFICATION_TYPES.INFO, duration);
  }, [addToast]);

  const ai = useCallback((message, duration = 4000) => {
    return addToast(message, NOTIFICATION_TYPES.AI, duration);
  }, [addToast]);

  return {
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
};

export default useToast;