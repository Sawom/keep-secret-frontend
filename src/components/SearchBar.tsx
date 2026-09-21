'use client';

import {
    useState,
    useEffect,
    Suspense,
    useRef,
} from 'react';

import {
    useRouter,
    useSearchParams,
} from 'next/navigation';

import {
    Search,
    X,
} from 'lucide-react';

function SearchBarContent() {
    const router = useRouter();
    const searchParams =
        useSearchParams();

    const urlQuery =
        searchParams.get('q') || '';

    const [isSearchOpen, setIsSearchOpen] =
        useState(false);

    const [inputValue, setInputValue] =
        useState('');

    /**
     * User typing করছে কিনা।
     *
     * URL update হওয়ার সময় input overwrite
     * হওয়া আটকাবে।
     */
    const isTypingRef =
        useRef(false);

    const latestValueRef =
        useRef('');

    const timerRef =
        useRef<ReturnType<
            typeof setTimeout
        > | null>(null);

    /**
     * URL -> input sync
     *
     * Browser back/forward করলে input update হবে।
     *
     * কিন্তু user typing করার সময় URL input
     * overwrite করবে না।
     */
    useEffect(() => {
        if (isTypingRef.current) {
            return;
        }

        setInputValue(urlQuery);
        latestValueRef.current =
            urlQuery;

        if (urlQuery) {
            setIsSearchOpen(true);
        }
    }, [urlQuery]);

    /**
     * Search navigation
     */
    useEffect(() => {
        if (!isSearchOpen) {
            return;
        }

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        const query =
            latestValueRef.current.trim();

        timerRef.current =
            setTimeout(() => {
                const currentQuery =
                    new URLSearchParams(
                        window.location.search,
                    ).get('q') || '';

                if (currentQuery === query) {
                    isTypingRef.current =
                        false;

                    return;
                }

                const params =
                    new URLSearchParams();

                if (query) {
                    params.set('q', query);
                }

                const queryString =
                    params.toString();

                isTypingRef.current =
                    false;

                router.replace(
                    queryString
                        ? `/dashboard/search?${queryString}`
                        : '/dashboard/search',
                );
            }, 400);

        return () => {
            if (timerRef.current) {
                clearTimeout(
                    timerRef.current,
                );

                timerRef.current = null;
            }
        };
    }, [
        inputValue,
        isSearchOpen,
        router,
    ]);

    const handleOpenSearch = () => {
        setIsSearchOpen(true);

        setInputValue(urlQuery);

        latestValueRef.current =
            urlQuery;
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value =
            e.target.value;

        isTypingRef.current =
            true;

        latestValueRef.current =
            value;

        setInputValue(value);
    };

    const handleClearSearch = () => {
        if (timerRef.current) {
            clearTimeout(
                timerRef.current,
            );

            timerRef.current = null;
        }

        isTypingRef.current =
            false;

        latestValueRef.current = '';

        setInputValue('');
        setIsSearchOpen(false);

        router.replace(
            '/dashboard/search',
        );
    };

    return (
        <div className="relative flex items-center">
            {isSearchOpen ? (
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 w-48 sm:w-72 transition-all">
                    <Search className="w-4 h-4 text-zinc-400 mr-2 min-w-[16px]" />

                    <input
                        type="text"
                        placeholder="Search notes and notebooks..."
                        value={inputValue}
                        onChange={
                            handleInputChange
                        }
                        autoFocus
                        className="bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-zinc-100 w-full"
                    />

                    <button
                        type="button"
                        onClick={
                            handleClearSearch
                        }
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-zinc-600"
                        title="Clear search"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={
                        handleOpenSearch
                    }
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="Search"
                >
                    <Search className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}

export default function SearchBar() {
    return (
        <Suspense
            fallback={
                <div className="w-8 h-8" />
            }
        >
            <SearchBarContent />
        </Suspense>
    );
}