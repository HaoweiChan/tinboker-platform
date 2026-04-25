import { useState, useEffect } from 'react';

const HISTORY_KEY = 'recent_searches';
const MAX_HISTORY = 10;

export const useSearchHistory = () => {
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const saved = localStorage.getItem(HISTORY_KEY);
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse search history', e);
            }
        }
    }, []);

    const addToHistory = (query: string) => {
        if (!query.trim()) return;
        const cleanQuery = query.trim();

        setHistory(prev => {
            // Remove existing if present to move to top
            const filtered = prev.filter(item => item.toLowerCase() !== cleanQuery.toLowerCase());
            const newHistory = [cleanQuery, ...filtered].slice(0, MAX_HISTORY);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const removeFromHistory = (query: string) => {
        setHistory(prev => {
            const newHistory = prev.filter(item => item !== query);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem(HISTORY_KEY);
    };

    return { history, addToHistory, removeFromHistory, clearHistory };
};
