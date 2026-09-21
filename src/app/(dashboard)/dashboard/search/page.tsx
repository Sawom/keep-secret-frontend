'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    Suspense,
} from 'react';

import {
    useRouter,
    useSearchParams,
} from 'next/navigation';

import {
    Loader2,
    SearchX,
    Pin,
    Trash2,
    GripVertical, Folder
} from 'lucide-react';

import { noteService } from '@/services/note.service';
import {
    notebookService,
    Notebook,
} from '@/services/notebook.service';
import { Note } from '@/store/useNotesStore';


function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const query =
        searchParams.get('q')?.trim() || '';

    /*
     * IMPORTANT:
     * Search URL empty হলে search page-এ থাকবে না।
     * /dashboard/notes এ চলে যাবে।
     */
    useEffect(() => {
        if (!query) {
            router.replace('/dashboard/notes');
        }
    }, [query, router]);


    /*
     * ============================
     * Notes search
     * ============================
     */

    const [notes, setNotes] = useState<Note[]>([]);
    const [notesLoading, setNotesLoading] =
        useState(false);


    /*
     * ============================
     * Notebook search
     * ============================
     */

    const [notebooks, setNotebooks] =
        useState<Notebook[]>([]);

    const [notebooksLoading, setNotebooksLoading] =
        useState(false);

    const [notebooksLoadingMore, setNotebooksLoadingMore] =
        useState(false);

    const [notebooksHasMore, setNotebooksHasMore] =
        useState(false);

    const [notebooksNextCursor, setNotebooksNextCursor] =
        useState<string | null>(null);

    const loadMoreRef =
        useRef<HTMLDivElement | null>(null);

    const notebookLoadingRef =
        useRef(false);


    /*
     * ============================
     * Search notes
     * ============================
     */

    useEffect(() => {
        if (!query) {
            setNotes([]);
            return;
        }

        const controller =
            new AbortController();

        const fetchNotes = async () => {
            try {
                setNotesLoading(true);

                const response =
                    await noteService.searchNotes(
                        query,
                        50,
                        controller.signal
                    );

                /*
                 * API response:
                 *
                 * {
                 *   data: Note[],
                 *   hasMore: boolean
                 * }
                 */
                setNotes(
                    response?.data ?? []
                );
            } catch (error: any) {
                if (
                    error?.name !==
                    'CanceledError' &&
                    error?.code !==
                    'ERR_CANCELED'
                ) {
                    console.error(
                        'Failed to search notes:',
                        error
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setNotesLoading(false);
                }
            }
        };

        fetchNotes();

        return () => {
            controller.abort();
        };
    }, [query]);


    /*
     * ============================
     * Search notebooks - first page
     * ============================
     */

    useEffect(() => {
        if (!query) {
            setNotebooks([]);
            setNotebooksNextCursor(null);
            setNotebooksHasMore(false);
            return;
        }

        const controller =
            new AbortController();

        const fetchNotebooks = async () => {
            try {
                setNotebooksLoading(true);

                const response =
                    await notebookService.getNotebooks(
                        20,
                        undefined,
                        query,
                    );

                setNotebooks(
                    response?.data ?? []
                );

                setNotebooksNextCursor(
                    response?.nextCursor ?? null
                );

                setNotebooksHasMore(
                    response?.hasMore ?? false
                );
            } catch (error: any) {
                if (
                    error?.name !==
                    'CanceledError' &&
                    error?.code !==
                    'ERR_CANCELED'
                ) {
                    console.error(
                        'Failed to search notebooks:',
                        error
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setNotebooksLoading(false);
                }
            }
        };

        fetchNotebooks();

        return () => {
            controller.abort();
        };
    }, [query]);


    /*
     * ============================
     * Load more notebooks
     * ============================
     */

    const loadMoreNotebooks =
        useCallback(async () => {
            if (
                notebookLoadingRef.current ||
                !notebooksHasMore ||
                !notebooksNextCursor ||
                !query
            ) {
                return;
            }

            try {
                notebookLoadingRef.current = true;

                setNotebooksLoadingMore(true);

                const response =
                    await notebookService.getNotebooks(
                        20,
                        notebooksNextCursor,
                        query
                    );

                const nextData =
                    response?.data ?? [];

                setNotebooks((previous) => {
                    const existingIds =
                        new Set(
                            previous.map(
                                (item) =>
                                    item.id
                            )
                        );

                    const newItems =
                        nextData.filter(
                            (item) =>
                                !existingIds.has(
                                    item.id
                                )
                        );

                    return [
                        ...previous,
                        ...newItems,
                    ];
                });

                setNotebooksNextCursor(
                    response?.nextCursor ?? null
                );

                setNotebooksHasMore(
                    response?.hasMore ?? false
                );
            } catch (error) {
                console.error(
                    'Failed to load more notebooks:',
                    error
                );
            } finally {
                notebookLoadingRef.current = false;
                setNotebooksLoadingMore(false);
            }
        }, [
            query,
            notebooksHasMore,
            notebooksNextCursor,
        ]);


    /*
     * ============================
     * Notebook infinite scroll
     * ============================
     *
     * Same fix as Notes page:
     * loading অবস্থায় observer attach করার
     * চেষ্টা করবে না।
     */

    useEffect(() => {
        if (
            !query ||
            notebooksLoading ||
            !notebooksHasMore
        ) {
            return;
        }

        const element =
            loadMoreRef.current;

        if (!element) {
            return;
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    if (
                        entries[0]?.isIntersecting
                    ) {
                        loadMoreNotebooks();
                    }
                },
                {
                    rootMargin: '600px',
                }
            );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [
        query,
        notebooksLoading,
        notebooksHasMore,
        loadMoreNotebooks,
    ]);


    /*
     * ============================
     * Open note
     * ============================
     *
     * Notes-এর নিজের UI/Modal Notes page-এই আছে।
     *
     * তাই search result থেকে note click করলে
     * Notes page-এ noteId পাঠাবো।
     *
     * Notes page সেই ID দেখে existing
     * handleStartEdit(note) trigger করবে।
     */

    const openNote = (
        note: Note
    ) => {
        router.push(
            `/dashboard/notes?search=${encodeURIComponent(
                query
            )}&noteId=${encodeURIComponent(
                note.id
            )}`
        );
    };


    /*
     * ============================
     * Open notebook
     * ============================
     */

    const openNotebook = (
        notebook: Notebook
    ) => {
        router.push(
            `/dashboard/notebooks/${notebook.id}`
        );
    };


    /*
     * ============================
     * Empty query
     * ============================
     */

    if (!query) {
        return null;
    }


    const isLoading =
        notesLoading ||
        notebooksLoading;


    return (
        <div className="w-full space-y-8">

            {/* Search heading */}

            <div className="px-2">
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Search results for "{query}"
                </h2>
            </div>


            {/* ========================= */}
            {/* NOTES */}
            {/* ========================= */}

            <section className="space-y-4">

                <h3 className="px-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    Notes
                </h3>


                {notesLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500 space-y-2">
                        <SearchX className="w-9 h-9 stroke-[1.5]" />

                        <p className="text-sm">
                            No matching notes found
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                        {notes.map((note) => {
                            const rawColor =
                                note.color
                                    ?.toLowerCase()
                                    ?.trim();

                            const isDefaultColor =
                                !rawColor ||
                                rawColor ===
                                '#ffffff' ||
                                rawColor ===
                                '#fff' ||
                                rawColor ===
                                'white' ||
                                rawColor ===
                                'transparent';

                            return (
                                <div
                                    key={note.id}

                                    /*
                                     * IMPORTANT:
                                     * পুরো Notes card clickable.
                                     * আলাদা Open button নেই।
                                     */
                                    onClick={() =>
                                        openNote(
                                            note
                                        )
                                    }

                                    style={{
                                        backgroundColor:
                                            isDefaultColor
                                                ? undefined
                                                : note.color,
                                    }}

                                    className={`group relative rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border cursor-pointer ${isDefaultColor
                                        ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                        : 'border-black/10 dark:border-white/20 text-zinc-900 dark:text-zinc-100'
                                        }`}
                                >

                                    <div className="absolute top-3 right-3 flex items-center gap-1">

                                        {/* Search result-এ drag নেই */}

                                        <button
                                            type="button"

                                            onClick={(
                                                e
                                            ) => {
                                                e.stopPropagation();
                                            }}

                                            className={`p-1.5 rounded-full transition-opacity cursor-pointer ${note.isPinned
                                                ? 'opacity-100 text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                                                : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                }`}

                                            title={
                                                note.isPinned
                                                    ? 'Pinned note'
                                                    : 'Pinned note'
                                            }
                                        >
                                            <Pin className="w-4 h-4" />
                                        </button>

                                    </div>


                                    <div className="space-y-2 pr-12">

                                        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 text-base">
                                            {note.title}
                                        </h3>

                                        <p className="text-zinc-600 dark:text-zinc-300 text-sm whitespace-pre-wrap line-clamp-6">
                                            {note.content}
                                        </p>

                                    </div>


                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/60 opacity-0 group-hover:opacity-100 transition-opacity">

                                        {(() => {
                                            const created =
                                                new Date(
                                                    note.createdAt
                                                ).getTime();

                                            const updated =
                                                new Date(
                                                    note.updatedAt
                                                ).getTime();

                                            const isUpdated =
                                                Math.abs(
                                                    updated -
                                                    created
                                                ) >
                                                2000;

                                            return (
                                                <span className="text-[11px] text-zinc-400">
                                                    {isUpdated
                                                        ? 'Edited: '
                                                        : 'Created: '}

                                                    {new Date(
                                                        note.updatedAt ||
                                                        note.createdAt
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        }
                                                    )}
                                                </span>
                                            );
                                        })()}

                                        <button
                                            type="button"

                                            onClick={(
                                                e
                                            ) => {
                                                e.stopPropagation();
                                            }}

                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 rounded-full transition-colors cursor-pointer"

                                            title="Delete note"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </section>


            {/* ========================= */}
            {/* NOTEBOOKS */}
            {/* ========================= */}

            <section className="space-y-4">

                <h3 className="px-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    Notebooks
                </h3>


                {notebooksLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                    </div>
                ) : notebooks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500 space-y-2">
                        <SearchX className="w-9 h-9 stroke-[1.5]" />

                        <p className="text-sm">
                            No matching notebooks found
                        </p>
                    </div>
                ) : (
                    <>
                        {/*
                         * IMPORTANT:
                         *
                         * এখানে তোমার already-fixed Notebook card UI
                         * 그대로 রাখবে।
                         *
                         * শুধু card-এর existing onClick/open behavior:
                         *
                         * openNotebook(notebook)
                         *
                         * করবে।
                         */}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {notebooks.map(
                                (
                                    notebook,
                                ) => (
                                    <div
                                        key={
                                            notebook.id
                                        }
                                        onClick={() =>
                                            openNotebook(
                                                notebook,
                                            )
                                        }
                                        className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                                                    style={{
                                                        backgroundColor:
                                                            notebook.color ||
                                                            '#3B82F6',
                                                    }}
                                                >
                                                    <Folder className="w-5 h-5" />
                                                </div>

                                                <span className="text-[11px] px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                                                    Notebook
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 text-base">
                                                    {
                                                        notebook.title
                                                    }
                                                </h3>

                                                <p className="text-zinc-500 dark:text-zinc-400 text-xs line-clamp-2 mt-1">
                                                    {
                                                        notebook.description ||
                                                        'No description provided.'
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-500">
                                            <span>
                                                {
                                                    notebook
                                                        ._count
                                                        ?.notes ||
                                                    0
                                                }{' '}
                                                notes
                                            </span>

                                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                Open →
                                            </span>
                                        </div>
                                    </div>
                                ),
                            )}

                        </div>


                        {notebooksHasMore && (
                            <div
                                ref={
                                    loadMoreRef
                                }
                                className="flex justify-center py-8"
                            >
                                {notebooksLoadingMore && (
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />

                                        Loading more notebooks...
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

            </section>


            {/* Both empty */}

            {!isLoading &&
                notes.length === 0 &&
                notebooks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 space-y-3">

                        <SearchX className="w-12 h-12 stroke-[1.5]" />

                        <p className="text-base font-medium">
                            No results found
                        </p>

                        <p className="text-xs text-zinc-400">
                            Try searching with a different keyword.
                        </p>

                    </div>
                )}

        </div>
    );
}


export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
            }
        >
            <SearchContent />
        </Suspense>
    );
}