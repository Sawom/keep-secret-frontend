'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // হাইড্রেশন মিসম্যাচ এড়ানোর জন্য
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-full px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 opacity-0">
                Loading...
            </div>
        );
    }

    const isDark = theme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
            {isDark ? (
                <>
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span>Light Mode</span>
                </>
            ) : (
                <>
                    <Moon className="w-5 h-5 text-indigo-500" />
                    <span>Dark Mode</span>
                </>
            )}
        </button>
    );
}