import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../features/auth/authSlice';
import LoginModal from './Auth/LoginModal';
import RegisterModal from './Auth/RegisterModal';
import { Code2, BookOpen, Terminal, LayoutDashboard, LogOut, User, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { to: '/compiler', label: 'Compiler', icon: <Terminal className="w-3.5 h-3.5" /> },
    { to: '/notebook', label: 'Notebook', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <nav className="h-14 border-b border-dark-border bg-dark-bg/95 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-40 sticky top-0">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">JIGRI</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive(to)
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {icon}
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {token && user ? (
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border hover:bg-dark-hover text-sm text-gray-300 hover:text-white transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="hidden sm:block">{user.username}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-dark-border">
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      id="logout-btn"
                      onClick={() => { dispatch(logout() as any); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button
                id="login-btn"
                onClick={() => { setShowLogin(true); setShowRegister(false); }}
                className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all font-medium"
              >
                Log in
              </button>
              <button
                id="register-btn"
                onClick={() => { setShowRegister(true); setShowLogin(false); }}
                className="text-sm bg-brand-500 hover:bg-brand-600 text-white px-4 py-1.5 rounded-lg font-medium transition-all shadow-lg shadow-brand-500/20"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }}
        />
      )}
    </>
  );
};

export default Navbar;