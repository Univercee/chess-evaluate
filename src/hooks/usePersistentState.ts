import { useEffect, useState } from 'react';

/**
 * useState that remembers its value in localStorage (per browser).
 * Falls back to plain state when storage is unavailable (private mode, blocked site data).
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? initial : (JSON.parse(saved) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Not persisted, but still works for this session
    }
  }, [key, value]);

  return [value, setValue] as const;
}
