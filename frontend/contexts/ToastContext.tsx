import * as React from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const addToast = React.useCallback((toast: Omit<ToastMessage, 'id'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prevToasts => [...prevToasts, { ...toast, id }]);
    
    const duration = toast.duration || 3000;
    if (duration !== Infinity) {
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }
    return id;
  }, [removeToast]);

  const value = React.useMemo(() => ({
    toasts,
    addToast,
    removeToast
  }), [toasts, addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;