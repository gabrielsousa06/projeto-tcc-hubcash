import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

const DURATION_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), DURATION_MS);
  }, [removeToast]);

  const styles: Record<ToastType, { bg: string; icon: string }> = {
    success: { bg: 'linear-gradient(90deg, #0F4CFF 0%, #10B981 100%)', icon: '✓' },
    error:   { bg: '#EF4444', icon: '✕' },
    info:    { bg: '#334155', icon: 'ℹ' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Container dos toasts */}
      <div
        style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 2000,
          display: 'flex', flexDirection: 'column', gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              minWidth: '260px',
              maxWidth: '360px',
              background: styles[t.type].bg,
              color: 'white',
              borderRadius: '12px',
              padding: '14px 16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              animation: 'toastIn 0.2s ease-out',
            }}
          >
            <span style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', flexShrink: 0,
            }}>
              {styles[t.type].icon}
            </span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}