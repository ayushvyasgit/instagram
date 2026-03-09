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
}

const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
  }

  // Load from current tokens
  const token = localStorage.getItem('access_token');
  const refresh = localStorage.getItem('refresh_token');
  
  // also check old Zustand store
  let oldStoreParsed = null;
  try {
    const oldStore = localStorage.getItem('auth-storage');
    if (oldStore) {
      oldStoreParsed = JSON.parse(oldStore).state;
    }
  } catch(e) {}

  const userStr = localStorage.getItem('user');

  if (token && userStr) {
    try {
      return {
        user: JSON.parse(userStr),
        accessToken: token,
        refreshToken: refresh,
        isAuthenticated: true,
      };
    } catch (e) {
      return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
    }
  } else if (oldStoreParsed && oldStoreParsed.isAuthenticated) {
     return {
        user: oldStoreParsed.user,
        accessToken: oldStoreParsed.accessToken,
        refreshToken: oldStoreParsed.refreshToken,
        isAuthenticated: true,
     };
  }

  return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
};

const initialState: AuthState = getInitialState();

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

      // persist to local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', action.payload.accessToken);
        localStorage.setItem('refresh_token', action.payload.refreshToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
      }
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;

export default authSlice.reducer;
