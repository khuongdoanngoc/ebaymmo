import { useState, useEffect } from 'react';

/**
 * A custom hook that returns a debounced version of the provided value
 * @param value The value to be debounced
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
function useDebounced<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up a timer to update the debounced value after the specified delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timer if the value changes before the delay has elapsed
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default useDebounced;
