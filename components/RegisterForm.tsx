import React, { useState } from 'react';
import GoogleSignIn from './GoogleSignIn';

interface RegisterFormProps {
  onRegisterSubmit: (username: string, email: string, pass: string) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSubmit, onSwitchToLogin, isLoading, error }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }
    onRegisterSubmit(username, email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5"> 
      <div>
        <label htmlFor="reg-username" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}> 
          Username
        </label>
        <input
          id="reg-username" name="username" type="text" autoComplete="username" required
          value={username} onChange={(e) => setUsername(e.target.value)}
          className="input-base" disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}> 
          Email address
        </label>
        <input
          id="reg-email" name="email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="input-base" disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}> 
          Password
        </label>
        <input
          id="reg-password" name="password" type="password" autoComplete="new-password" required
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="input-base" disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="reg-confirm-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}> 
          Confirm Password
        </label>
        <input
          id="reg-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-base" disabled={isLoading}
        />
      </div>

      {(error || formError) && (
        <p className="text-xs text-center py-2 px-3 rounded-md" style={{ color: 'var(--color-accent-danger)', backgroundColor: `var(--color-accent-danger)1A`}}>{error || formError}</p>
      )}

      <div>
        <button
          type="submit" disabled={isLoading}
          className="btn btn-primary w-full flex justify-center py-3 px-4"
        >
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>
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
        Already have an account?{' '}
        <button
          type="button" onClick={onSwitchToLogin}
          className={`font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-offset-1 rounded`}
          style={{ color: 'var(--color-primary-dark)' }}
          disabled={isLoading}
        >
          Login
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;