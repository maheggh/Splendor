import React, { createContext, useContext, useEffect, useState } from 'react';

type Toast = { id: number; message: string };
type ToastCtx = { show: (message: string) => void };

const ToastContext = createContext<ToastCtx>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-3 right-3 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className="bg-black/80 text-white px-3 py-2 rounded shadow">{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
