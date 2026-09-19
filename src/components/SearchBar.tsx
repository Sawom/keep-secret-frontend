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
    usePathname,
} from 'next/navigation';

import {
    Search,
    X,
} from 'lucide-react';

function SearchBarContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const urlSearchQuery =
        searchParams.get('search') || '';

    const [isSearchOpen, setIsSearchOpen] =
        useState(false);

    const [inputValue, setInputValue] =
        useState('');

    /*
     * Search debounce timer।
     */
    const searchTimerRef =
        useRef<ReturnType<
            typeof setTimeout
        > | null>(null);

    /*
     * Search version।
     *
     * পুরোনো pending search update যেন
     * নতুন state overwrite করতে না পারে।
     */
    const searchVersionRef =
        useRef(0);

    /*
     * URL থেকে input sync।
     *
     * URL-এ search থাকলে search box open থাকবে।
     */
    useEffect(() => {
        if (urlSearchQuery) {
            setInputValue(
                urlSearchQuery
            );

            setIsSearchOpen(true);

            return;
        }

        /*
         * URL থেকে search পুরোপুরি চলে গেলে
         * input-ও clear হবে।
         */
        setInputValue('');
    }, [urlSearchQuery]);

    /*
     * Search input change হলে debounce করে
     * URL update করা হবে।
     */
    useEffect(() => {
        if (!isSearchOpen) {
            return;
        }

        /*
         * আগের timer clear।
         */
        if (searchTimerRef.current) {
            clearTimeout(
                searchTimerRef.current
            );

            searchTimerRef.current =
                null;
        }

        /*
         * নতুন search version।
         */
        const currentVersion =
            ++searchVersionRef.current;

        const query =
            inputValue.trim();

        /*
         * Empty query হলেও URL update করতে হবে।
         *
         * এটাই আগের bug-এর মূল fix।
         */
        searchTimerRef.current =
            setTimeout(() => {
                /*
                 * পুরোনো timer হলে ignore।
                 */
                if (
                    currentVersion !==
                    searchVersionRef.current
                ) {
                    return;
                }

                const params =
                    new URLSearchParams(
                        searchParams.toString()
                    );

                if (query) {
                    /*
                     * Search আছে।
                     */
                    params.set(
                        'search',
                        query
                    );
                } else {
                    /*
                     * Search empty।
                     *
                     * URL থেকে search পুরো remove।
                     */
                    params.delete(
                        'search'
                    );
                }

                const queryString =
                    params.toString();

                router.replace(
                    queryString
                        ? `${pathname}?${queryString}`
                        : pathname
                );

                searchTimerRef.current =
                    null;
            }, 400);

        return () => {
            if (
                searchTimerRef.current
            ) {
                clearTimeout(
                    searchTimerRef.current
                );

                searchTimerRef.current =
                    null;
            }
        };
    }, [
        inputValue,
        isSearchOpen,
        router,
        pathname,
        searchParams,
    ]);

    /*
     * Search button।
     */
    const handleOpenSearch = () => {
        setIsSearchOpen(true);

        setInputValue(
            urlSearchQuery
        );
    };

    /*
     * Search clear button।
     */
    const handleClearSearch = () => {
        /*
         * Pending debounce invalidate।
         */
        searchVersionRef.current += 1;

        /*
         * Pending timer cancel।
         */
        if (searchTimerRef.current) {
            clearTimeout(
                searchTimerRef.current
            );

            searchTimerRef.current =
                null;
        }

        /*
         * Input clear।
         */
        setInputValue('');

        /*
         * Search box close।
         */
        setIsSearchOpen(false);

        /*
         * URL থেকে search immediately remove।
         */
        const params =
            new URLSearchParams(
                searchParams.toString()
            );

        params.delete('search');

        const queryString =
            params.toString();

        router.replace(
            queryString
                ? `${pathname}?${queryString}`
                : pathname
        );
    };

    return (
        <div className="relative flex items-center">
            {isSearchOpen ? (
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 w-48 sm:w-72 transition-all">

                    <Search className="w-4 h-4 text-zinc-400 mr-2 min-w-[16px]" />

                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(
                                e.target.value
                            );
                        }}
                        autoFocus
                        className="bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-zinc-100 w-full"
                    />

                    <button
                        type="button"
                        onClick={
                            handleClearSearch
                        }
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-zinc-600"
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