
import React, { useState, useEffect } from 'react';
import { Colors } from '../constants.ts';
import { useToast } from '../contexts/ToastContext.tsx';

interface ToastMessageProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export const ToastMessageComponent: React.FC<ToastMessageProps> = ({ id, message, type }) => {
  const { removeToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);
  
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(id), 300); 
  };

  let baseBgColor = Colors.cardBackground; // White
  let accentColor = Colors.text_secondary; // Default gray
  let iconColor = Colors.text_secondary;
  let textColor = Colors.text; // Dark gray for primary text
  let icon = null;

  switch (type) {
    case 'success':
      accentColor = Colors.accentSuccess;
      iconColor = Colors.accentSuccess;
      icon = ( <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
      break;
    case 'error':
      accentColor = Colors.accentError;
      iconColor = Colors.accentError;
      icon = ( <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
      break;
    case 'info':
      accentColor = Colors.accentInfo;
      iconColor = Colors.accentInfo;
      icon = ( <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
      break;
    case 'warning':
      accentColor = Colors.accentWarning;
      iconColor = Colors.accentWarning;
      icon = ( <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> );
      break;
  }

  return (
    <div 
      className={`p-3.5 rounded-lg shadow-lg flex items-start max-w-xs sm:max-w-sm md:max-w-md w-full mx-auto ${isExiting ? 'animate-fadeOutRight' : 'animate-fadeInRight'}`}
      style={{ 
        backgroundColor: baseBgColor, 
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: Colors.boxShadow, 
      }}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {icon && <div className="flex-shrink-0 pt-0.5" style={{color: iconColor}}>{icon}</div>}
      <div className="ml-3 flex-1">
        <p className="text-sm font-semibold" style={{ color: textColor }}>{message}</p>
      </div>
      <div className="ml-3 flex-shrink-0">
        <button
          onClick={handleClose}
          className={`inline-flex rounded-md p-1 transition ease-in-out duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1`}
          style={{color: Colors.text_secondary, backgroundColor: 'transparent', WebkitTapHighlightColor: 'transparent', ['--tw-ring-offset-color' as any]: baseBgColor, ['--tw-ring-color' as any]: accentColor }}
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
