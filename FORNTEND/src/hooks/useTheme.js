import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectTheme,
  toggleTheme as toggleThemeAction,
  setTheme as setThemeAction,
} from '../features/ui/uiSlice';

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  const toggleTheme = () => {
    dispatch(toggleThemeAction());
  };

  const setTheme = (newTheme) => {
    dispatch(setThemeAction(newTheme));
  };

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };
};

export default useTheme;
