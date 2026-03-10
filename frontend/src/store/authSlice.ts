import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  profile_picture_url?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  authLoaded: boolean;
}

// SSR-safe: always start with empty state so server and client produce identical HTML
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  authLoaded: false,
};

export const loadAuthFromStorage = (): Partial<AuthState> => {
  if (typeof window === 'undefined') return {};
  try {
    const token = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      return { user: JSON.parse(userStr), accessToken: token, refreshToken: refresh, isAuthenticated: true };
    }
    // migrate old Zustand store
    const oldStore = localStorage.getItem('auth-storage');
    if (oldStore) {
      const old = JSON.parse(oldStore).state;
      if (old?.isAuthenticated) {
        return { user: old.user, accessToken: old.accessToken, refreshToken: old.refreshToken, isAuthenticated: true };
      }
    }
  } catch (e) {}
  return {};
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.authLoaded = true;

      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', action.payload.accessToken);
        localStorage.setItem('refresh_token', action.payload.refreshToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    // Called once on client mount to restore auth from localStorage
    hydrateAuth: (state, action: PayloadAction<Partial<AuthState>>) => {
      if (action.payload.isAuthenticated) {
        state.user = action.payload.user ?? null;
        state.accessToken = action.payload.accessToken ?? null;
        state.refreshToken = action.payload.refreshToken ?? null;
        state.isAuthenticated = true;
      }
      state.authLoaded = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.authLoaded = true;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
      }
    },
  },
});

export const { setAuth, clearAuth, hydrateAuth } = authSlice.actions;

export default authSlice.reducer;
