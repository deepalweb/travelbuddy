import React, { useEffect, useCallback } from 'react';
import LoginForm from './LoginForm.tsx';
import RegisterForm from './RegisterForm.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx'; 

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  view: 'login' | 'register';
  onSwitchView: () => void;
  onLogin: (identifier: string, pass: string) => Promise<void>;
  onRegister: (username: string, email: string, pass: string) => Promise<void>;
  onForgotPassword: (emailOrUsername: string) => void;
  isLoading: boolean;
  error: string | null;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  view,
  onSwitchView,
  onLogin,
  onRegister,
  onForgotPassword,
  isLoading,
  error
}) => {
  const [isVisible, setIsVisible] = React.useState<boolean>(false);
  const { t } = useLanguage(); 

  useEffect(() => {
    if (isOpen) setIsVisible(true);
  }, [isOpen]);

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); 
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWithAnimation();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleCloseWithAnimation]);

  if (!isOpen && !isVisible) return null;

  const modalTitleKey = view === 'login' ? 'authModal.welcomeBack' : 'authModal.createAccount';

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-40 transition-opacity duration-300 ease-out
                  ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(8px)' }} 
      onClick={handleCloseWithAnimation}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className={`card-base w-full sm:max-w-md flex flex-col relative
                    transform transition-all duration-300 ease-out
                    ${isVisible && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{ 
          maxHeight: '90vh', 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b" 
             style={{
                backgroundImage: 'var(--gradient-accent)',
                borderColor: 'var(--color-glass-border)'
             }}> 
          <h2 id="auth-modal-title" className="text-lg sm:text-xl font-bold text-white"> 
            {t(modalTitleKey)}
          </h2>
          <button
            onClick={handleCloseWithAnimation}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 ring-white"
            aria-label={t('close') + " " + t(modalTitleKey)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"> 
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto"> 
          {view === 'login' ? (
            <LoginForm 
              onLoginSubmit={onLogin} onSwitchToRegister={onSwitchView} 
              onForgotPassword={onForgotPassword}
              isLoading={isLoading} error={error}
            />
          ) : (
            <RegisterForm 
              onRegisterSubmit={onRegister} onSwitchToLogin={onSwitchView} 
              isLoading={isLoading} error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;