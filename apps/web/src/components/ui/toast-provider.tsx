'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, title }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              {toast.title && <strong className="toast-title">{toast.title}</strong>}
              <p className="toast-message">{toast.message}</p>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>
      <style>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 9999;
        }
        .toast {
          min-width: 300px;
          max-width: 400px;
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 18%);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          animation: slideIn 0.3s ease-out forwards;
        }
        .toast-success { border-left: 4px solid hsl(142, 76%, 36%); }
        .toast-error { border-left: 4px solid hsl(0, 84%, 60%); }
        .toast-info { border-left: 4px solid hsl(210, 100%, 50%); }

        .toast-content { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .toast-title { color: hsl(210, 40%, 96%); font-size: 0.9375rem; }
        .toast-message { margin: 0; color: hsl(215, 20%, 65%); font-size: 0.875rem; line-height: 1.4; }

        .toast-close {
          background: transparent;
          border: none;
          color: hsl(215, 20%, 50%);
          font-size: 1.25rem;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          transition: color 0.2s;
        }
        .toast-close:hover { color: hsl(210, 40%, 96%); }

        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

