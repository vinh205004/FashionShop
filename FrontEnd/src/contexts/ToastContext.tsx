import React, { createContext, useContext, useMemo, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number; // ms
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number, actions?: ToastItem['actions']) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, type: ToastType = 'info', duration = 4000, actions?: ToastItem['actions']) => {
    const id = Math.random().toString(36).slice(2, 9);
    const toast: ToastItem = { id, message, type, duration, actions };
    setToasts((t) => [...t, toast]);
    // auto remove
    setTimeout(() => {
      setToasts((t) => t.filter(x => x.id !== id));
    }, duration);
    return id;
  };

  const removeToast = (id: string) => setToasts((t) => t.filter(x => x.id !== id));

  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3 items-end">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-sm w-full px-4 py-3 rounded shadow-lg text-sm text-white flex items-center justify-between ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>
            <div className="flex-1 pr-3">{t.message}</div>
            <div className="flex items-center gap-2">
              {t.actions?.map((a, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    try {
                      a.onClick();
                    } catch (err) {
                      // swallow to avoid breaking UI
                      console.error('Toast action error', err);
                    }
                    removeToast(t.id);
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium ${a.variant === 'primary' ? 'bg-white text-gray-900' : 'bg-white/20 text-white'}`}
                >
                  {a.label}
                </button>
              ))}
              <button onClick={() => removeToast(t.id)} className="ml-2 opacity-80 hover:opacity-100">×</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export default ToastContext;
