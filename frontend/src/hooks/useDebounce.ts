import { useState, useEffect } from "react";

// Delays updating a value until user stops typing
// Prevents API call on every single keystroke
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // If value changes before timer fires — reset timer
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
