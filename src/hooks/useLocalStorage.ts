import { useEffect, useState } from "react";

/** localStorage-backed state — used for frontend-only preferences. */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initialValue;
      const parsed = JSON.parse(raw) as T;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && !Array.isArray(initialValue)) {
        return { ...(initialValue as object), ...(parsed as object) } as T;
      }
      return parsed;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — preferences stay in memory only */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
