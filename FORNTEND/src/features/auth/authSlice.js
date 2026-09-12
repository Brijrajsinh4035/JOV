import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authApi from '../../api/authApi';
import { APP_CONFIG } from '../../utils/constants';
import { storage } from '../../utils/storage';

const rawToken = storage.get(APP_CONFIG.TOKEN_KEY, null);
const rawUser = storage.get(APP_CONFIG.USER_KEY, null);

const isLegacyDemo =
  (typeof rawToken === 'string' && rawToken.startsWith('gov_token_')) ||
  (rawUser && (rawUser.id === 'usr-gov-001' || rawUser.name?.includes('Verma')));

if (isLegacyDemo) {
  storage.remove(APP_CONFIG.TOKEN_KEY);
  storage.remove(APP_CONFIG.USER_KEY);
}

const storedToken = isLegacyDemo ? null : rawToken;
const storedUser = isLegacyDemo ? null : rawUser;

const initialState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken && storedUser),
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authApi.login(credentials);
      storage.set(APP_CONFIG.TOKEN_KEY, data.token);
      storage.set(APP_CONFIG.USER_KEY, data.user);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed. Verify credentials.');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authApi.register(userData);
      if (data?.token && data?.user) {
        storage.set(APP_CONFIG.TOKEN_KEY, data.token);
        storage.set(APP_CONFIG.USER_KEY, data.user);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Registration failed. Verify credentials.');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getProfile();
      storage.set(APP_CONFIG.USER_KEY, user);
      return user;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch user profile');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      storage.remove(APP_CONFIG.TOKEN_KEY);
      storage.remove(APP_CONFIG.USER_KEY);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) => {
  const role = (state.auth.user?.role || '').toUpperCase();
  return role === 'ADMIN' || !!state.auth.user?.isAdmin;
};
export const selectUserRole = (state) => {
  const role = (state.auth.user?.role || '').toUpperCase();
  return role === 'ADMIN' ? 'ADMIN' : 'VIEWER';
};
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
