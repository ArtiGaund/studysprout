/**
 * @module ReduxHooks
 * @description Centralized, type-safe wrappers for standard React-Redux hooks.
 * * WHY THIS MATTERS:
 * 1. Type Intelligence: `useAppSelector` provides full Autocomplete for the 
 * entire `RootState`, preventing developers from accessing non-existent slices.
 * 2. Middleware Awareness: `useAppDispatch` is pre-configured with `AppDispatch`, 
 * which is essential for correctly typing Thunks and other async middleware.
 * 3. Refactoring Safety: If the Redux store structure changes, TypeScript 
 * will automatically flag errors across all components using these hooks.
 */
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "./store";

/**
 * @hook useAppSelector
 * @description A strictly typed version of `useSelector`. 
 * Eliminates the need to manually import `RootState` in every component.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * @hook useAppDispatch
 * @description A strictly typed version of `useDispatch`. 
 * Ensures that dispatched actions and thunks match the store's middleware configuration.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();