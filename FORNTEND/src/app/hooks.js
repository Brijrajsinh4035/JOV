import { useDispatch, useSelector } from 'react-redux';

/**
 * Standard Redux hooks for cleaner consumption in React components
 */
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
