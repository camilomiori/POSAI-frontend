import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import errorTracker from './utils/errorTracking' // REACTIVADO

// Initialize error tracking
if (import.meta.env.DEV) {
  console.log('🔧 Error Tracker initialized (controlled)');
}

// Handle WebSocket errors silently in development (Vite HMR)
if (import.meta.env.DEV) {
  // Add debugging helpers to window
  window.errorTracker = errorTracker;
  window.debugApp = {
    getErrors: () => errorTracker.getErrors(),
    clearErrors: () => errorTracker.clearErrors(),
    exportErrors: () => errorTracker.exportErrors(),
    getSummary: () => errorTracker.getErrorSummary()
  };

  console.log('🐛 Debug helpers available: window.debugApp');
  
  // Enhanced WebSocket error handling with tracking
  window.addEventListener('error', (event) => {
    if (event.message.includes('WebSocket') || event.message.includes('ws://')) {
      console.warn('WebSocket connection issue (development mode):', event.message);
      // Still track but don't report externally
      errorTracker.captureError({
        type: 'websocket',
        message: event.message,
        severity: 'low',
        development: true,
        timestamp: Date.now()
      });
      event.preventDefault();
      return false;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('WebSocket') || event.reason?.toString()?.includes('ws://')) {
      console.warn('WebSocket promise rejection (development mode):', event.reason);
      // Still track but don't report externally
      errorTracker.captureError({
        type: 'websocket-promise',
        message: event.reason?.message || 'WebSocket promise rejection',
        severity: 'low',
        development: true,
        timestamp: Date.now()
      });
      event.preventDefault();
      return false;
    }
  });
}

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
