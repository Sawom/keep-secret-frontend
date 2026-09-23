'use client';
import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pin, Trash2, Loader2, SearchX, GripVertical, X, CheckSquare } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';

// আসল নোট পেজের লজিক ও ইউআই অংশ
function NotesContent() {
    const searchParams = useSearchParams();

    const searchQuery =
        searchParams.get('search')?.trim() || '';

    const {
        notes,
        searchResults,
        searchLoading,
        loading,
        hasMore,
        loadingMore,
        loadMoreNotes,
        noteToDelete,
        setNoteToDelete,
        editingNoteId,
        editTitle,
        setEditTitle,
        editBody,
        setEditBody,
        isUpdating,
        handleStartEdit,
        handleSaveEdit,
        handleCloseModal,
        confirmDelete,
        handleTogglePin,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
    } = useNotes(searchQuery);

    const loadMoreRef =
        useRef<HTMLDivElement | null>(null);

    /*
     * Search থাকলে backend থেকে আসা search results দেখাবে।
     *
     * Search না থাকলে normal paginated notes দেখাবে।
     */
    const displayedNotes =
        searchQuery
            ? searchResults
            : notes;

    /*
     * Normal notes-এর infinite scroll।
     *
     * Search mode-এ infinite scroll বন্ধ থাকবে,
     * কারণ search আলাদা endpoint থেকে result আনে।
     */
    useEffect(() => {
        if (
            searchQuery ||
            loading ||
            !hasMore
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
                        loadMoreNotes();
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
        loadMoreNotes,
        hasMore,
        searchQuery,
        loading,
    ]);

    /*
     * Initial normal notes loading।
     *
     * Search result-এর loading আলাদা।
     */
    if (
        loading &&
        !searchQuery
    ) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    const formatLocalDate = (
        dateString?: string
    ) => {
        if (!dateString) return '';

        const date =
            new Date(dateString);

        return (
            date.toLocaleDateString(
                'en-US',
                {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                }
            ) +
            ' at ' +
            date.toLocaleTimeString(
                [],
                {
                    hour: '2-digit',
                    minute: '2-digit',
                }
            )
        );
    };

    /*
     * Search loading-এর সময় spinner দেখাবে।
     */
    if (searchQuery && searchLoading) {
        return (
            <div className="w-full space-y-6 relative">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        {`Search results for "${searchQuery}"`}
                    </h2>
                </div>

                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 relative">

            <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {searchQuery
                        ? `Search results for "${searchQuery}"`
                        : 'All Notes (Drag to reorder)'}
                </h2>
            </div>

            {/*
             * Empty state-এর সবচেয়ে গুরুত্বপূর্ণ fix।
             *
             * Search না করলে কখনো "No matching notes"
             * দেখাবে না।
             */}
            {searchQuery.trim().length > 0 &&
                !searchLoading &&
                displayedNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 space-y-3">
                    <SearchX className="w-12 h-12 stroke-[1.5]" />

                    <p className="text-base font-medium">
                        No matching notes found
                    </p>

                    <p className="text-xs text-zinc-400">
                        Try searching with a different keyword.
                    </p>
                </div>
            ) : displayedNotes.length === 0 ? (
                /*
                 * Normal notes empty হলে আলাদা message।
                 */
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 space-y-3">
                    <SearchX className="w-12 h-12 stroke-[1.5]" />

                    <p className="text-base font-medium">
                        No notes yet
                    </p>

                    <p className="text-xs text-zinc-400">
                        Create a note to get started.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                        {displayedNotes.map(
                            (note, index) => {
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
                                        key={
                                            note.id
                                        }

                                        draggable={
                                            !searchQuery
                                        }

                                        onDragStart={() => {
                                            if (
                                                !searchQuery
                                            ) {
                                                handleDragStart(
                                                    index
                                                );
                                            }
                                        }}

                                        onDragOver={(
                                            e
                                        ) => {
                                            if (
                                                !searchQuery
                                            ) {
                                                handleDragOver(
                                                    e,
                                                    index
                                                );
                                            }
                                        }}

                                        onDragEnd={() => {
                                            if (
                                                !searchQuery
                                            ) {
                                                handleDragEnd();
                                            }
                                        }}

                                        onClick={() =>
                                            handleStartEdit(
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

                                            {!searchQuery && (
                                                <span className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-zinc-400 p-1">
                                                    <GripVertical className="w-4 h-4" />
                                                </span>
                                            )}

                                            <button
                                                onClick={(
                                                    e
                                                ) => {
                                                    e.stopPropagation();

                                                    handleTogglePin(
                                                        note.id,
                                                        note.isPinned
                                                    );
                                                }}

                                                className={`p-1.5 rounded-full transition-opacity cursor-pointer ${note.isPinned
                                                    ? 'opacity-100 text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                                                    : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                    }`}

                                                title={
                                                    note.isPinned
                                                        ? 'Unpin note'
                                                        : 'Pin note'
                                                }
                                            >
                                                <Pin className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-2 pr-12">
                                            <h3 className="font-semibold truncate text-zinc-800 dark:text-zinc-100 text-base">
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

                                                        {formatLocalDate(
                                                            note.updatedAt ||
                                                            note.createdAt
                                                        )}
                                                    </span>
                                                );
                                            })()}

                                            <button
                                                onClick={(
                                                    e
                                                ) => {
                                                    e.stopPropagation();

                                                    setNoteToDelete(
                                                        note.id
                                                    );
                                                }}

                                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 rounded-full transition-colors cursor-pointer"

                                                title="Delete note"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                        )}

                    </div>

                    {/*
                     * IMPORTANT:
                     *
                     * loadMoreRef আর last card-এর সাথে নেই।
                     * আলাদা sentinel হিসেবে grid-এর নিচে আছে।
                     *
                     * Search mode-এ এটা render হবে না।
                     */}
                    {!searchQuery &&
                        hasMore && (
                            <div
                                ref={
                                    loadMoreRef
                                }
                                className="flex justify-center py-8"
                            >
                                {loadingMore && (
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />

                                        Loading more notes...
                                    </div>
                                )}
                            </div>
                        )}

                </>
            )}

            {/* Edit component modal */}
            {editingNoteId &&
                (() => {
                    const activeNote =
                        displayedNotes.find(
                            (n) =>
                                n.id ===
                                editingNoteId
                        );

                    if (!activeNote)
                        return null;

                    const rawColor =
                        activeNote?.color
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
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                            <div
                                style={{
                                    backgroundColor:
                                        isDefaultColor
                                            ? undefined
                                            : activeNote?.color,
                                }}

                                className={`relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 border ${isDefaultColor
                                    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                                    : 'border-black/10 dark:border-white/20 text-zinc-900 dark:text-zinc-100'
                                    }`}

                                onClick={(e) =>
                                    e.stopPropagation()
                                }
                            >
                                <div className="absolute top-4 right-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleTogglePin(
                                                activeNote.id,
                                                activeNote.isPinned
                                            )
                                        }
                                        className={`p-1.5 rounded-full transition-colors cursor-pointer ${activeNote?.isPinned
                                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                                            : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                            }`}
                                        title={
                                            activeNote?.isPinned
                                                ? 'Unpin note'
                                                : 'Pin note'
                                        }
                                    >
                                        <Pin className="w-5 h-5" />
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Title"
                                    value={editTitle}
                                    onChange={(e) =>
                                        setEditTitle(
                                            e.target.value
                                        )
                                    }
                                    className="w-full pr-10 bg-transparent border-none outline-none font-semibold text-zinc-800 dark:text-zinc-100 text-lg"
                                    autoFocus
                                    required
                                />

                                <textarea
                                    placeholder="Take a note..."
                                    value={editBody}
                                    onChange={(e) =>
                                        setEditBody(
                                            e.target.value
                                        )
                                    }
                                    rows={6}
                                    className="w-full bg-transparent border-none outline-none text-base text-zinc-700 dark:text-zinc-300 resize-none max-h-96 overflow-y-[field-sizing:content] [field-sizing:content]"
                                    required
                                />

                                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                        {(() => {
                                            const created =
                                                new Date(
                                                    activeNote.createdAt
                                                ).getTime();

                                            const updated =
                                                new Date(
                                                    activeNote.updatedAt
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

                                                    {formatLocalDate(
                                                        activeNote.updatedAt ||
                                                        activeNote.createdAt
                                                    )}
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isUpdating && (
                                            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                                        )}

                                        <button
                                            type="button"
                                            title="Save Update"
                                            onClick={
                                                handleSaveEdit
                                            }
                                            disabled={
                                                isUpdating
                                            }
                                            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <CheckSquare className="w-4 h-4" />
                                        </button>

                                        <button
                                            type="button"
                                            title='Cancel'
                                            onClick={handleCloseModal}
                                            disabled={isUpdating}
                                            className="px-4 py-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                        >
                                            <X className="w-4 h-4 " />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

            {/* Delete Confirmation Modal */}
            {noteToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-80 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                            Move to trash?
                        </h3>

                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Are you sure you want to move this note to the trash?
                        </p>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() =>
                                    setNoteToDelete(
                                        null
                                    )
                                }
                                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={
                                    confirmDelete
                                }
                                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function NotesPage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
            }
        >
            <NotesContent />
        </Suspense>
    );
}