
import React from 'react';
import { useToast } from '../contexts/ToastContext.tsx';
import { ToastMessageComponent } from './ToastMessage.tsx';

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-20 sm:top-24 right-4 z-[9999] space-y-3 w-full max-w-sm sm:max-w-md"> {/* Increased z-index for floating header */}
      {toasts.map(toast => (
        <ToastMessageComponent
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
