// A debounce utility is essential to prevent sending an API request on every keystroke

import { useRef, useCallback, useEffect } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear the previous timeout if func or delay changes (rare for this use case)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array means it runs once on mount/unmount

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay] // Recreate debounced function if func or delay changes
  ) as T;
}