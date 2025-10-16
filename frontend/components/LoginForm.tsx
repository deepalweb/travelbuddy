import React, { useState } from 'react';
import GoogleSignIn from './GoogleSignIn';

interface LoginFormProps {
  onLoginSubmit: (identifier: string, pass: string) => Promise<void>;
  onSwitchToRegister: () => void;
  onForgotPassword: (identifier: string) => void;
  isLoading: boolean;
  error: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSubmit, onSwitchToRegister, onForgotPassword, isLoading, error }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSubmit(identifier, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6"> 
      <div>
        <label htmlFor="identifier" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}> 
          Username or Email
        </label>
        <input
          id="identifier" name="identifier" type="text" autoComplete="username" required
          value={identifier} onChange={(e) => setIdentifier(e.target.value)}
          className="input-base"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}> 
          Password
        </label>
        <input
          id="password" name="password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="input-base"
          disabled={isLoading}
        />
      </div>

      {error && (
        <p className="text-xs text-center py-2 px-3 rounded-md" style={{ color: 'var(--color-accent-danger)', backgroundColor: `var(--color-accent-danger)1A` }}>{error}</p>
      )}

      <div>
        <button
          type="submit" disabled={isLoading}
          className="btn btn-primary w-full flex justify-center py-3 px-4"
        >
          {isLoading ? 'Logging In...' : 'Login'}
        </button>
        <div className="mt-2 text-right">
          <button
            type="button"
            onClick={() => onForgotPassword(identifier)}
            className="text-xs underline"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>
      </div>

      <div className="relative my-2"> 
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t" style={{borderColor: 'var(--color-glass-border)'}}></div>
        </div>
        <div className="relative flex justify-center text-xs"> 
          <span className="px-2" style={{backgroundColor: 'var(--color-glass-bg)', color: 'var(--color-text-secondary)'}}>
            Or
          </span>
        </div>
      </div>

      <div>
        <GoogleSignIn />
      </div>

      <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}> 
        Don't have an account?{' '}
        <button
          type="button" onClick={onSwitchToRegister}
          className={`font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-offset-1 rounded`}
          style={{ color: 'var(--color-primary-dark)' }}
          disabled={isLoading}
        >
          Sign Up
        </button>
      </p>
    </form>
  );
};

export default LoginForm;