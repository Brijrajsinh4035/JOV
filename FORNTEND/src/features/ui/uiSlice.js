import { createSlice } from '@reduxjs/toolkit';
import { APP_CONFIG } from '../../utils/constants';
import { storage } from '../../utils/storage';

const initialTheme = storage.get(APP_CONFIG.THEME_KEY, APP_CONFIG.DEFAULT_THEME);

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    if (document.body) document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    if (document.body) document.body.classList.remove('dark');
  }
};

// Initialize document data-theme and dark class immediately
applyTheme(initialTheme);

const initialState = {
  theme: initialTheme,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  toasts: [],
  activeModal: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      storage.set(APP_CONFIG.THEME_KEY, state.theme);
      applyTheme(state.theme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      storage.set(APP_CONFIG.THEME_KEY, state.theme);
      applyTheme(state.theme);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = action.payload;
    },
    closeMobileSidebar: (state) => {
      state.mobileSidebarOpen = false;
    },
    addToast: (state, action) => {
      const toast = {
        id: Date.now() + Math.random().toString(36).substring(2, 5),
        type: action.payload.type || 'info', // 'success' | 'error' | 'warning' | 'info'
        message: action.payload.message,
        duration: action.payload.duration || 4000,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    openModal: (state, action) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  closeMobileSidebar,
  addToast,
  removeToast,
  clearToasts,
  openModal,
  closeModal,
} = uiSlice.actions;

export const selectTheme = (state) => state.ui.theme;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectMobileSidebarOpen = (state) => state.ui.mobileSidebarOpen;
export const selectToasts = (state) => state.ui.toasts;
export const selectActiveModal = (state) => state.ui.activeModal;

export default uiSlice.reducer;
