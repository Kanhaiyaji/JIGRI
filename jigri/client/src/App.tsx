import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { setAuthSession } from './features/auth/authSlice';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Compiler from './pages/Compiler';
import Notebook from './pages/Notebook';
import Dashboard from './pages/Dashboard';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        dispatch(
          setAuthSession({
            user: {
              id: session.user.id,
              username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              avatarUrl: session.user.user_metadata?.avatar_url,
            },
            token: session.access_token,
          })
        );
      }
    });

    // Listen for auth state changes (sign in, sign out, token refresh, OAuth redirects)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        dispatch(
          setAuthSession({
            user: {
              id: session.user.id,
              username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              avatarUrl: session.user.user_metadata?.avatar_url,
            },
            token: session.access_token,
          })
        );
      } else {
        dispatch(setAuthSession({ user: null, token: null }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/compiler" element={<Compiler />} />
          <Route path="/notebook" element={<Notebook />} />
          <Route path="/notebook/:id" element={<Notebook />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
