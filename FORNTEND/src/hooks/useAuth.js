import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  loginUser,
  registerUser,
  logout as logoutAction,
} from '../features/auth/authSlice';
import { addToast } from '../features/ui/uiSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const login = useCallback(
    async (credentials) => {
      const result = await dispatch(loginUser(credentials));
      if (loginUser.fulfilled.match(result)) {
        dispatch(
          addToast({
            type: 'success',
            message: `Welcome back, ${result.payload.user?.name || 'User'}!`,
          })
        );
        return { success: true };
      } else {
        dispatch(
          addToast({
            type: 'error',
            message: result.payload || 'Login failed. Please try again.',
          })
        );
        return { success: false, error: result.payload };
      }
    },
    [dispatch]
  );

  const register = useCallback(
    async (userData) => {
      const result = await dispatch(registerUser(userData));
      if (registerUser.fulfilled.match(result)) {
        dispatch(
          addToast({
            type: 'success',
            message: `Account registered successfully! Welcome, ${result.payload.user?.name || 'Officer'}!`,
          })
        );
        return { success: true, data: result.payload };
      } else {
        dispatch(
          addToast({
            type: 'error',
            message: result.payload || 'Registration failed. Please try again.',
          })
        );
        return { success: false, error: result.payload };
      }
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
    dispatch(
      addToast({
        type: 'info',
        message: 'You have been signed out.',
      })
    );
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  };
};

export default useAuth;
