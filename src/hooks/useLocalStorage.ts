// useLocalStorage — a small, strict-mode-safe generic hook for persisting a
// single value to localStorage. The app's primary state lives in the Zustand
// store, but this hook is handy for lightweight, component-local persistence
// (e.g. remembering UI preferences such as the selected flashcard domain).

import { useCallback, useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* storage may be unavailable (private mode); fail silently */
        }
        return next;
      });
    },
    [key],
  );

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setStoredValue(readValue());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, readValue]);

  return [storedValue, setValue] as const;
}
