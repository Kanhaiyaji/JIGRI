import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { registerWithSupabase, signInWithOAuth, clearAuthError } from '../../features/auth/authSlice';
import { X, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterModal = ({ onClose, onSwitchToLogin }: RegisterModalProps) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(registerWithSupabase({ username, email, password }) as any);
    if (!res.error) {
      onClose();
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    const res = await dispatch(signInWithOAuth(provider) as any);
    if (!res.error) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4" onClick={onClose}>
      <div
        className="bg-dark-card border border-dark-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/5 pointer-events-none" />
          <button
            id="register-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
            <p className="text-sm text-gray-400">Join JIGRI and start coding in the cloud</p>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="px-6 space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="register-oauth-github"
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-bg border border-dark-border hover:border-gray-500 hover:bg-dark-hover rounded-xl text-sm font-medium text-gray-200 transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </button>
            <button
              type="button"
              id="register-oauth-google"
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-bg border border-dark-border hover:border-gray-500 hover:bg-dark-hover rounded-xl text-sm font-medium text-gray-200 transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1A11.996 11.996 0 0012 24z" />
                <path fill="#FBBC05" d="M5.28 14.32a7.18 7.18 0 010-4.64v-3.1H1.25a11.996 11.996 0 000 10.84l4.03-3.1z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.42 0 3.48 2.56 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z" />
              </svg>
              Google
            </button>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-dark-border" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">or with email</span>
            <div className="flex-1 h-px bg-dark-border" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2.5 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="register-username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (error) dispatch(clearAuthError()); }}
                placeholder="johndoe"
                minLength={3}
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) dispatch(clearAuthError()); }}
                placeholder="you@example.com"
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) dispatch(clearAuthError()); }}
                placeholder="Min. 6 characters"
                minLength={6}
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold transition-all text-sm shadow-lg shadow-brand-500/20 mt-2 cursor-pointer"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create account'}
          </button>

          {onSwitchToLogin && (
            <p className="text-center text-sm text-gray-500 pt-1">
              Already have an account?{' '}
              <button
                type="button"
                id="switch-to-login"
                onClick={onSwitchToLogin}
                className="text-brand-400 hover:text-brand-300 font-medium transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;