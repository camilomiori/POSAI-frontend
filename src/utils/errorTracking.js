// utils/errorTracking.js
import React from 'react';

/**
 * Sistema de seguimiento de errores avanzado para POS AI
 * Incluye logging, reporting y manejo de errores en tiempo real
 */

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.listeners = [];
    this.init();
  }

  init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        reason: event.reason,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // React Error Boundary errors (captured via custom method)
    this.setupReactErrorCapture();
  }

  setupReactErrorCapture() {
    // Override console.error to capture React errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this is a React error
      const errorMsg = args[0]?.toString() || '';
      if (errorMsg.includes('React') || errorMsg.includes('component')) {
        this.captureError({
          type: 'react',
          message: errorMsg,
          args: args,
          timestamp: Date.now(),
          url: window.location.href,
          component: this.extractComponentFromError(errorMsg)
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  extractComponentFromError(errorMsg) {
    // Try to extract component name from error message
    const componentMatch = errorMsg.match(/in ([A-Z][a-zA-Z0-9]*)/);
    return componentMatch ? componentMatch[1] : 'Unknown';
  }

  captureError(errorData) {
    // Enhance error with additional context
    const enhancedError = {
      ...errorData,
      id: this.generateErrorId(),
      severity: this.determineSeverity(errorData),
      context: this.gatherContext(),
      fingerprint: this.generateFingerprint(errorData)
    };

    // Add to errors array
    this.errors.unshift(enhancedError);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Notify listeners
    this.notifyListeners(enhancedError);

    // Log to console in development
    if (import.meta.env.DEV) {
      this.logErrorToConsole(enhancedError);
    }

    // Send to external service in production (if configured)
    if (import.meta.env.PROD && this.shouldReport(enhancedError)) {
      this.reportToExternalService(enhancedError);
    }

    return enhancedError;
  }

  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  determineSeverity(errorData) {
    // Determine severity based on error type and content
    if (errorData.type === 'javascript' && errorData.message.includes('TypeError')) {
      return 'high';
    }
    if (errorData.type === 'react' && errorData.message.includes('Cannot read prop')) {
      return 'medium';
    }
    if (errorData.type === 'promise' && errorData.message.includes('WebSocket')) {
      return 'low';
    }
    return 'medium';
  }

  gatherContext() {
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      connection: navigator.connection ? {
        type: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null
    };
  }

  generateFingerprint(errorData) {
    // Generate a fingerprint to group similar errors
    const key = `${errorData.type}:${errorData.message}:${errorData.filename}:${errorData.lineno}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
  }

  logErrorToConsole(errorData) {
    const style = this.getConsoleStyle(errorData.severity);
    console.group(`%c🐛 Error Captured [${errorData.severity.toUpperCase()}]`, style);
    console.log('ID:', errorData.id);
    console.log('Type:', errorData.type);
    console.log('Message:', errorData.message);
    console.log('Timestamp:', new Date(errorData.timestamp).toLocaleString());
    if (errorData.stack) {
      console.log('Stack:', errorData.stack);
    }
    console.log('Context:', errorData.context);
    console.log('Full Error:', errorData);
    console.groupEnd();
  }

  getConsoleStyle(severity) {
    switch (severity) {
      case 'high': return 'color: #dc2626; font-weight: bold;';
      case 'medium': return 'color: #f59e0b; font-weight: bold;';
      case 'low': return 'color: #6b7280; font-weight: bold;';
      default: return 'color: #374151; font-weight: bold;';
    }
  }

  shouldReport(errorData) {
    // Don't report low severity errors or WebSocket errors
    if (errorData.severity === 'low' || errorData.message.includes('WebSocket')) {
      return false;
    }
    return true;
  }

  async reportToExternalService(errorData) {
    // Placeholder for external error reporting service
    // Replace with your preferred service (Sentry, Bugsnag, etc.)
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });
      if (!response.ok) {
        throw new Error('Failed to report error');
      }
    } catch (err) {
      console.warn('Failed to report error to external service:', err);
    }
  }

  // Public API methods
  getErrors() {
    return [...this.errors];
  }

  getErrorsByType(type) {
    return this.errors.filter(error => error.type === type);
  }

  getErrorsBySeverity(severity) {
    return this.errors.filter(error => error.severity === severity);
  }

  clearErrors() {
    this.errors = [];
    this.notifyListeners({ type: 'cleared' });
  }

  addEventListener(callback) {
    this.listeners.push(callback);
  }

  removeEventListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners(errorData) {
    this.listeners.forEach(listener => {
      try {
        listener(errorData);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  // Manual error capture
  captureException(error, context = {}) {
    return this.captureError({
      type: 'manual',
      message: error.message || error.toString(),
      error: error,
      stack: error.stack,
      context: { ...this.gatherContext(), ...context },
      timestamp: Date.now()
    });
  }

  // Performance monitoring
  capturePerformanceIssue(metric, value, threshold) {
    if (value > threshold) {
      this.captureError({
        type: 'performance',
        message: `Performance issue: ${metric} (${value}ms > ${threshold}ms)`,
        metric,
        value,
        threshold,
        timestamp: Date.now()
      });
    }
  }

  // Export errors for debugging
  exportErrors() {
    const exportData = {
      errors: this.errors,
      summary: this.getErrorSummary(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getErrorSummary() {
    const summary = {
      total: this.errors.length,
      byType: {},
      bySeverity: {},
      recent: this.errors.filter(e => Date.now() - e.timestamp < 24 * 60 * 60 * 1000).length
    };

    this.errors.forEach(error => {
      summary.byType[error.type] = (summary.byType[error.type] || 0) + 1;
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
    });

    return summary;
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

// React Hook for using error tracker in components
export const useErrorTracker = () => {
  const [errors, setErrors] = React.useState([]);

  React.useEffect(() => {
    const handleError = (errorData) => {
      if (errorData.type === 'cleared') {
        setErrors([]);
      } else {
        setErrors(prev => [errorData, ...prev.slice(0, 9)]); // Keep last 10 errors
      }
    };

    errorTracker.addEventListener(handleError);
    setErrors(errorTracker.getErrors().slice(0, 10));

    return () => {
      errorTracker.removeEventListener(handleError);
    };
  }, []);

  return {
    errors,
    captureException: errorTracker.captureException.bind(errorTracker),
    capturePerformanceIssue: errorTracker.capturePerformanceIssue.bind(errorTracker),
    clearErrors: errorTracker.clearErrors.bind(errorTracker),
    exportErrors: errorTracker.exportErrors.bind(errorTracker),
    getErrorSummary: errorTracker.getErrorSummary.bind(errorTracker)
  };
};

export default errorTracker;