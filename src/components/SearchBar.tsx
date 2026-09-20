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
    const urlSearchQuery = searchParams.get('search') || '';
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    /* * Debounce timer. */
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /* * Prevent URL -> input sync from * interfering with user typing. */
    const isTypingRef = useRef(false);
    /* * Keep track of the latest input value. */
    const latestValueRef = useRef('');
    /* * AbortController for the debounce/update flow. */
    const searchVersionRef = useRef(0);
    /* * URL -> input synchronization. * * This is mainly needed for: * - Browser Back * - Browser Forward * - Direct URL navigation */

    useEffect(() => {
        /* * If the user is actively typing, * don't overwrite the input from URL. */
        if (isTypingRef.current) { return; }
        const normalizedUrlQuery = urlSearchQuery;
        setInputValue(normalizedUrlQuery);
        latestValueRef.current = normalizedUrlQuery;
        if (normalizedUrlQuery) {
            setIsSearchOpen(true);
        }
    }, [urlSearchQuery]);

    /* * Search input change. * * The input itself changes immediately. * URL update is debounced. */
    useEffect(() => {
        if (!isSearchOpen) { return; }
        /* * Cancel previous debounce. */
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
            searchTimerRef.current = null;
        } const query = inputValue.trim();

        latestValueRef.current = inputValue;
        /* * Every new input creates a new version. * * Any older scheduled update becomes invalid. */
        const currentVersion = ++searchVersionRef.current;
        searchTimerRef.current = setTimeout(() => {
            /* * Ignore stale timer. */
            if (currentVersion !== searchVersionRef.current) {
                return;
            }
            const currentUrlQuery = new URLSearchParams(window.location.search).get('search') || '';
            /* * Nothing to update. */
            if (currentUrlQuery === query) {
                isTypingRef.current = false; return;
            }
            const params = new URLSearchParams(window.location.search);
            if (query) {
                params.set('search', query);
            }
            else {
                params.delete('search');
            }
            const queryString = params.toString();
            /* * User has finished this input cycle. */
            isTypingRef.current = false;
            router.replace(queryString ? `${pathname}?${queryString}` : pathname);
        }, 400);
        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
                searchTimerRef.current = null;
            }
        };
    }, [inputValue, isSearchOpen, pathname, router,]);
    /* * Open search. */
    const handleOpenSearch = () => {
        setIsSearchOpen(true);
        setInputValue(urlSearchQuery);
        latestValueRef.current = urlSearchQuery;
        isTypingRef.current = false;
    };
    /* * Input change. */
    const handleInputChange = (value: string) => {
        /* * Mark that the input is controlled * by the user right now. */
        isTypingRef.current = true;
        /* * Update immediately. */
        setInputValue(value);
        latestValueRef.current = value;
    }; /* * Clear search completely. */
    const handleClearSearch = () => {
        /* * Invalidate all pending timers. */
        searchVersionRef.current += 1;
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
            searchTimerRef.current = null;
        }

        /* * Stop URL -> input sync * from interfering during clear. */
        isTypingRef.current = false; latestValueRef.current = '';
        setInputValue('');
        setIsSearchOpen(false);
        const params = new URLSearchParams(window.location.search);
        params.delete('search');
        const queryString = params.toString();
        router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    };
    return (
        <div className="relative flex items-center">
            {isSearchOpen ? (
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 w-48 sm:w-72 transition-all">
                    <Search className="w-4 h-4 text-zinc-400 mr-2 min-w-[16px]" />
                    <input type="text" placeholder="Search notes..." value={inputValue}
                        onChange={(e) => {
                            handleInputChange(e.target.value);
                        }}
                        autoFocus className="bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-zinc-100 w-full" />
                    <button type="button" onClick={handleClearSearch} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-zinc-600" >
                        <X className="w-4 h-4" />
                    </button>
                </div>) : (<button type="button" onClick={handleOpenSearch} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300 transition-colors" title="Search" >
                    <Search className="w-5 h-5" />
                </button>)}

        </div>);
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