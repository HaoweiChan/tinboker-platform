import { useState, useEffect } from 'react';

/**
 * Adaptive debounce hook that adjusts delay based on input length.
 * Shorter inputs (prefixes) get shorter delays for instant feedback.
 * Longer inputs get longer delays to reduce API load.
 * 
 * @param value The value to debounce
 * @param shortDelay Delay for short inputs (<= 2 chars), default 50ms
 * @param longDelay Delay for long inputs (> 2 chars), default 150ms
 */
export function useAdaptiveDebounce<T>(
    value: T,
    shortDelay: number = 50,
    longDelay: number = 150
): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const stringValue = String(value);
        const delay = stringValue.length <= 2 ? shortDelay : longDelay;

        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, shortDelay, longDelay]);

    return debouncedValue;
}
