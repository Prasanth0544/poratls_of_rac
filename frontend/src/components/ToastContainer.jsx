// frontend/src/components/ToastContainer.jsx
// Global Toast Notification Container

import React, { useState, useEffect } from 'react';
import '../components/ToastContainer.css';

// Keep track of toasts globally
let toastQueue = [];
let notifyFunction = null;

export const addToast = (toast) => {
  const id = Date.now() + Math.random();
  toastQueue.push({ ...toast, id });
  if (notifyFunction) {
    notifyFunction({ ...toast, id });
  }
};

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    notifyFunction = (toast) => {
      setToasts(prev => [...prev, toast]);

      // Auto remove toast after duration
      const duration = toast.duration || 4000;
      setTimeout(() => {
        removeToast(toast.id);
      }, duration);
    };

    // Process any queued toasts
    toastQueue.forEach(toast => {
      notifyFunction(toast);
    });
    toastQueue = [];

    return () => {
      notifyFunction = null;
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleClose = (id) => {
    removeToast(id);
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type || 'info'}`}
          role="alert"
          aria-live="polite"
        >
          <div className="toast-content">
            <span className="toast-icon">{toast.icon}</span>
            <div className="toast-message">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              {toast.message && <div className="toast-text">{toast.message}</div>}
            </div>
          </div>
          <button
            className="toast-close"
            onClick={() => handleClose(toast.id)}
            aria-label="Close notification"
          >
            ✕
          </button>
          {(toast.duration) && (
            <div 
              className="toast-progress" 
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
