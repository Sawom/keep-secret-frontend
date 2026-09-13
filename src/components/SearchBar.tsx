'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

function SearchBarContent() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (query) {
            params.set('search', query);
        } else {
            params.delete('search');
        }

        // ইউজার যেখানেই থাকুক না কেন, সার্চ করলে নোটস পেজে নিয়ে ফিল্টার দেখাবে
        router.push(`/dashboard/notes?${params.toString()}`);
    };

    return (
        <div className="relative flex items-center">
            {isSearchOpen ? (
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 w-48 sm:w-72 transition-all">
                    <Search className="w-4 h-4 text-zinc-400 mr-2 min-w-[16px]" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        autoFocus
                        className="bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-zinc-100 w-full"
                    />
                    <button
                        onClick={() => {
                            setIsSearchOpen(false);
                            router.push('/dashboard/notes');
                        }}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-zinc-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="Search"
                >
                    <Search className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}

// এক্সপোর্ট করার সময় Suspense দিয়ে র‍্যাপ করে দিতে হবে (Next.js এর নিয়মে)
export default function SearchBar() {
    return (
        <Suspense fallback={<div className="w-8 h-8" />}>
            <SearchBarContent />
        </Suspense>
    );
}