import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import api from '../../services/api';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
  isConfigured: isSupabaseConfigured,
};

export const loginWithSupabase = createAsyncThunk(
  'auth/loginWithSupabase',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      if (!isSupabaseConfigured) {
        // Mock login for offline / unconfigured dev environment
        const mockUser: User = {
          id: 'dev-user-' + email.split('@')[0],
          username: email.split('@')[0],
          email,
        };
        const mockToken = 'mock-jwt-token-for-' + mockUser.id;
        return { user: mockUser, token: mockToken };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user || !data.session) throw new Error('No user data returned');

      const user: User = {
        id: data.user.id,
        username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User',
        email: data.user.email || '',
        avatarUrl: data.user.user_metadata?.avatar_url,
      };

      return { user, token: data.session.access_token };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

export const registerWithSupabase = createAsyncThunk(
  'auth/registerWithSupabase',
  async (
    { username, email, password }: { username: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      if (!isSupabaseConfigured) {
        const mockUser: User = {
          id: 'dev-user-' + username.toLowerCase().replace(/[^a-z0-9]/g, ''),
          username,
          email,
        };
        const mockToken = 'mock-jwt-token-for-' + mockUser.id;
        return { user: mockUser, token: mockToken };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Registration failed');

      const user: User = {
        id: data.user.id,
        username: data.user.user_metadata?.username || username,
        email: data.user.email || email,
      };

      return { user, token: data.session?.access_token || null };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Registration failed');
    }
  }
);

export const signInWithOAuth = createAsyncThunk(
  'auth/signInWithOAuth',
  async (provider: 'github' | 'google', { rejectWithValue }) => {
    try {
      if (!isSupabaseConfigured) {
        const mockUser: User = {
          id: 'dev-oauth-user',
          username: `${provider}_user`,
          email: `${provider}@example.com`,
        };
        return { user: mockUser, token: 'mock-oauth-token' };
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        if (error.message?.includes('provider is not enabled') || (error as any).error_code === 'validation_failed') {
          throw new Error(`${provider.toUpperCase()} provider is not enabled in your Supabase project. Please use Email & Password or enable ${provider} in Supabase Dashboard -> Authentication -> Providers.`);
        }
        throw error;
      }
      return null;
    } catch (err: any) {
      const msg = err.message || `Failed to sign in with ${provider}`;
      if (msg.includes('provider is not enabled') || msg.includes('validation_failed')) {
        return rejectWithValue(`${provider.toUpperCase()} provider is not enabled in your Supabase project yet. Please use Email & Password or toggle ${provider} ON in Supabase Dashboard -> Authentication -> Providers.`);
      }
      return rejectWithValue(msg);
    }
  }
);

export const logoutWithSupabase = createAsyncThunk('auth/logoutWithSupabase', async () => {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
  }
  localStorage.removeItem('token');
  return null;
});

// Backward compatibility alias for any existing dispatch(login) / dispatch(register)
export const login = loginWithSupabase;
export const register = registerWithSupabase;
export const logout = logoutWithSupabase;

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthSession(state, action: PayloadAction<{ user: User | null; token: string | null }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      } else {
        localStorage.removeItem('token');
      }
      state.isLoading = false;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginWithSupabase.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginWithSupabase.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      }
    });
    builder.addCase(loginWithSupabase.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(registerWithSupabase.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerWithSupabase.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      }
    });
    builder.addCase(registerWithSupabase.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // OAuth
    builder.addCase(signInWithOAuth.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signInWithOAuth.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload?.user) {
        state.user = action.payload.user;
        state.token = action.payload.token;
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
      }
    });
    builder.addCase(signInWithOAuth.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logoutWithSupabase.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem('token');
    });
  },
});

export const { setAuthSession, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
