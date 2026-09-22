import { useState, useEffect, useRef, useCallback } from 'react';
import { noteService } from '@/services/note.service';
import { useNotesStore, Note } from '@/store/useNotesStore';

export function useNotes(searchQuery = '', notebookId?: string,) {

    /*
     *
     * Notes আর hook-এর local state-এ থাকবে না।
     * Zustand store থেকে নেওয়া হবে যাতে route change হলেও
     * আগের fetched data memory-তে থাকে।
     */
    const notes = useNotesStore((state) => state.notes);
    const trashNotes = useNotesStore(
        (state) => state.trashNotes
    );

    const hasLoaded = useNotesStore(
        (state) => state.hasLoaded
    );

    const hasTrashLoaded = useNotesStore(
        (state) => state.hasTrashLoaded
    );

    const setNotes = useNotesStore(
        (state) => state.setNotes
    );

    const setTrashNotes = useNotesStore(
        (state) => state.setTrashNotes
    );

    /*
     *
     * accessToken এখন HttpOnly cookie-তে থাকে।
     * তাই frontend থেকে accessToken পড়ার প্রয়োজন নেই।
     *
     * API request automatically cookie পাঠাবে।
     *
     * Cache থাকলে প্রথম render থেকেই data দেখানো হবে।
     */
    const [loading, setLoading] = useState(
        !hasLoaded
    );

    const [loadingMore, setLoadingMore] = useState(false);

    const [searchResults, setSearchResults] =
        useState<Note[]>([]);

    const [searchLoading, setSearchLoading] =
        useState(false);

    /*
 * Search request cancel করার জন্য।
 */
    const searchControllerRef =
        useRef<AbortController | null>(null);

    const hasMore = useNotesStore(
        (state) => state.hasMore
    );

    const [trashLoading, setTrashLoading] = useState(
        !hasTrashLoaded
    );

    // ড্র্যাগ এন্ড ড্রপের জন্য স্টেট
    const [draggedItemIndex, setDraggedItemIndex] =
        useState<number | null>(null);

    const notesRef = useRef<Note[]>(notes);
    const draggedItemIndexRef =
        useRef<number | null>(null);
    const originalNotesRef =
        useRef<Note[]>([]);
    const isReorderingRef =
        useRef(false);

    // ডিলিট কনফার্মেশন পপআপের জন্য স্টেট
    const [noteToDelete, setNoteToDelete] =
        useState<string | null>(null);

    // edit and save states
    const [editingNoteId, setEditingNoteId] =
        useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editBody, setEditBody] = useState('');
    const [isUpdating, setIsUpdating] =
        useState(false);

    // ডাবল রিকোয়েস্ট রোধ করার জন্য useRef ব্যবহার করা হলো
    const isUpdatingRef = useRef(false);
    const autoSaveTimerRef =
        useRef<NodeJS.Timeout | null>(null);

    /*
     *
     * Zustand store থেকে notes পরিবর্তন হলে local ref-টাও
     * sync করে রাখা হচ্ছে।
     *
     * Drag & Drop-এর সময় ref ব্যবহার করা হয়, তাই ref যেন
     * সর্বশেষ Zustand data ধরে রাখে সেটা নিশ্চিত করা হচ্ছে।
     */
    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    // কার্ডে ক্লিক করলে এডিট মোড ও মডাল ওপেন হবে
    const handleStartEdit = (note: Note) => {
        setEditingNoteId(note.id);
        setEditTitle(note.title || '');
        setEditBody(note.content || '');
    };

    // সেভ এবং ক্লোজ করার ফাংশন
    const handleSaveEdit = async () => {
        if (!editingNoteId) return;

        if (isUpdatingRef.current) {
            return;
        }

        try {
            isUpdatingRef.current = true;
            setIsUpdating(true);

            await noteService.updateNote(
                editingNoteId,
                {
                    title: editTitle,
                    content: editBody,
                }
            );

            // লোকাল স্টেট আপডেট করা যাতে UI ও ডেট সাথে সাথে রিফ্লেক্ট করে
            setNotes((prevNotes) =>
                prevNotes.map((note) =>
                    note.id === editingNoteId
                        ? {
                            ...note,
                            title: editTitle,
                            content: editBody,
                            updatedAt:
                                new Date().toISOString(),
                        }
                        : note
                )
            );
        } catch (error) {
            console.error(
                'Failed to update note:',
                error
            );
        } finally {
            isUpdatingRef.current = false;
            setIsUpdating(false);
        }
    };

    // ১০ সেকেন্ডের ডিবাউন্স অটো-সেভ
    useEffect(() => {
        if (!editingNoteId) return;

        if (autoSaveTimerRef.current) {
            clearTimeout(
                autoSaveTimerRef.current
            );
        }

        autoSaveTimerRef.current =
            setTimeout(() => {
                handleSaveEdit();
            }, 10000); // ১০ সেকেন্ড

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(
                    autoSaveTimerRef.current
                );
            }
        };
    }, [
        editTitle,
        editBody,
        editingNoteId,
    ]);

    // ক্লোজ করার ফাংশন
    const handleCloseModal = async () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(
                autoSaveTimerRef.current
            );

            autoSaveTimerRef.current = null;
        }

        // মোডাল বন্ধ করার সময় ফাইনাল সেভ কল করা হবে
        await handleSaveEdit();

        setEditingNoteId(null);
    };

    // ১. নোট ফেচ করা
    const fetchNotes = useCallback(
        async (loadMore = false) => {
            const store =
                useNotesStore.getState();

            if (
                !loadMore &&
                !store.hasLoaded
            ) {
                setLoading(true);
            }

            if (
                loadMore &&
                (
                    !store.hasMore ||
                    !store.nextCursor
                )
            ) {
                return;
            }

            try {
                const cursor =
                    loadMore
                        ? store.nextCursor
                        : undefined;

                const response =
                    await noteService.getNotes(
                        notebookId,
                        20,
                        cursor || undefined,
                    );

                /*
             * noteService থেকে pagination object পাওয়া যাচ্ছে:
             *
             * {
             *   data: Note[],
             *   nextCursor: string | null,
             *   hasMore: boolean
             * }
             */

                const pageData: Note[] =
                    response.data ?? [];

                setNotes(
                    (previous: Note[]) => {

                        /*
                     * First page হলে replace।
                     */

                        if (!loadMore) {
                            return pageData;
                        }

                        /*
                     * Next page হলে duplicate আটকানো।
                     */

                        const existingIds =
                            new Set(
                                previous.map(
                                    (note) =>
                                        note.id
                                )
                            );

                        const newNotes =
                            pageData.filter(
                                (note) =>
                                    !existingIds.has(
                                        note.id
                                    )
                            );

                        return [
                            ...previous,
                            ...newNotes,
                        ];
                    }
                );

                useNotesStore
                    .getState()
                    .setPagination(
                        response.nextCursor ??
                        null,
                        response.hasMore ??
                        false,
                    );
            } catch (error) {
                console.error(
                    'Failed to fetch notes:',
                    error
                );
            } finally {
                if (!loadMore) {
                    setLoading(false);
                }
            }
        },
        [
            notebookId,
            setNotes,
        ],
    );

    /*
     * 🔧 NEW:
     *
     * Scroll-এর কাছাকাছি গেলে পরের ২০টি note load করবে।
     *
     * Duplicate request আটকানোর জন্য ref ব্যবহার করা হচ্ছে।
     */
    const isLoadingMoreRef = useRef(false);

    const loadMoreNotes =
        useCallback(async () => {
            const store =
                useNotesStore.getState();

            if (
                isLoadingMoreRef.current ||
                !store.hasMore ||
                !store.nextCursor
            ) {
                return;
            }

            try {
                isLoadingMoreRef.current =
                    true;

                setLoadingMore(true);

                await fetchNotes(true);
            } catch (error) {
                console.error(
                    'Failed to load more notes:',
                    error,
                );
            } finally {
                isLoadingMoreRef.current =
                    false;

                setLoadingMore(false);
            }
        }, [fetchNotes]);


    /*
  * Search API।
  *
  * Search query change হলে পুরোনো request cancel
  * করে নতুন request পাঠাবে।
  */
    useEffect(() => {
        const query =
            searchQuery.trim();

        /*
         * Search query নেই।
         *
         * কোনো search API request হবে না।
         */
        if (!query) {
            searchControllerRef.current?.abort();

            searchControllerRef.current =
                null;

            setSearchResults([]);

            setSearchLoading(false);

            return;
        }

        /*
         * আগের search request cancel।
         */
        searchControllerRef.current?.abort();

        const controller = new AbortController();

        searchControllerRef.current = controller;

        const performSearch = async () => {
            try {
                setSearchLoading(true);

                const response =
                    await noteService.searchNotes(
                        query,
                        50,
                        controller.signal,
                    );

                /*
                 * পুরোনো request হলে ignore।
                 */
                if (controller.signal.aborted) {
                    return;
                }

                const searchData: Note[] =
                    response.data ?? [];

                setSearchResults(searchData);
            } catch (error: any) {
                /*
                 * Cancelled request ignore।
                 */
                if (controller.signal.aborted) {
                    return;
                }

                console.error(
                    'Failed to search notes:',
                    error,
                );

                setSearchResults([]);
            } finally {
                if (!controller.signal.aborted) {
                    setSearchLoading(false);
                }
            }
        };


        performSearch();

        return () => {
            controller.abort();
        };
    }, [searchQuery]);


    // ২. ট্র্যাশের নোটগুলো ফেচ করা
    const fetchTrashNotes = useCallback(
        async (isInitial = false) => {
            /*
             *
             * accessToken check removed.
             *
             * HttpOnly cookie automatically
             * authentication handle করবে।
             */

            try {
                /*
                 *
                 * Trash cache আগে থেকেই থাকলে route change-এর সময়
                 * নতুন spinner দেখানো হবে না।
                 */
                if (
                    isInitial &&
                    !hasTrashLoaded
                ) {
                    setTrashLoading(true);
                }

                const response: any =
                    await noteService.getTrashNotes();

                const trashData =
                    Array.isArray(response)
                        ? response
                        : response?.data ||
                        response?.notes ||
                        [];

                /*
                 *
                 * Trash data Zustand store-এ রাখা হচ্ছে।
                 */
                setTrashNotes(trashData);
            } catch (error) {
                console.error(
                    'Failed to fetch trash notes:',
                    error
                );
            } finally {
                setTrashLoading(false);
            }
        },
        [
            hasTrashLoaded,
            setTrashNotes,
        ]
    );

    // পেজ লোড ও ইভেন্ট শোনার জন্য useEffect (Initial fetch)
    useEffect(() => {
        const loadInitialNotes =
            async () => {
                const store =
                    useNotesStore.getState();

                store.resetPagination();

                /*
                 * Notebook ID থাকলে
                 * শুধু ওই notebook-এর notes fetch হবে।
                 */
                await fetchNotes(false);
            };

        loadInitialNotes();

        const handleNoteSaved =
            () => {
                const store =
                    useNotesStore.getState();

                store.resetPagination();

                fetchNotes(false);
            };

        window.addEventListener(
            'note-saved',
            handleNoteSaved
        );

        return () => {
            window.removeEventListener(
                'note-saved',
                handleNoteSaved
            );
        };
    }, [
        fetchNotes,
    ]);

    /*
     *
     * Trash page-এ গেলে trash data fetch হবে।
     *
     * যদি cache থাকে তাহলে প্রথমে cached data দেখাবে এবং
     * background-এ backend থেকে fresh data আনবে।
     */
    useEffect(() => {
        fetchTrashNotes(!hasTrashLoaded);
    }, [
        hasTrashLoaded,
        fetchTrashNotes,
    ]);

    // কনফার্মেশনের পর সফট ডিলিট হ্যান্ডলার
    const confirmDelete = async () => {
        if (!noteToDelete) return;

        try {
            /*
             *
             * Delete করার আগে note object বের করে রাখছি,
             * যাতে backend success হওয়ার পরে সেটাকে Trash cache-এ
             * instantly যোগ করা যায়।
             */
            const deletedNote = notes.find(
                (note) =>
                    note.id === noteToDelete
            );

            await noteService.softDeleteNote(
                noteToDelete
            );

            /*
             *
             * Active notes cache থেকে note remove করা হচ্ছে।
             */
            setNotes((prevNotes) =>
                prevNotes.filter(
                    (note) =>
                        note.id !== noteToDelete
                )
            );

            /*
             *
             * Backend delete successful হওয়ার পর একই note
             * Trash cache-এ instantly যোগ করা হচ্ছে।
             *
             * Backend পরে fresh data দিলে সেটাও replace হবে।
             */
            if (deletedNote) {
                setTrashNotes(
                    (prevTrashNotes) => [
                        deletedNote,
                        ...prevTrashNotes.filter(
                            (note) =>
                                note.id !==
                                noteToDelete
                        ),
                    ]
                );
            }

            setNoteToDelete(null);
        } catch (error) {
            console.error(
                'Failed to delete note:',
                error
            );
        }
    };

    /*
     *
     * Trash থেকে note restore করার function।
     *
     * Backend success হওয়ার পর Trash cache থেকে remove
     * এবং Active notes cache-এ add করা হবে।
     */
    const restoreNote = async (id: string) => {
        try {
            const restoredNote =
                trashNotes.find(
                    (note) =>
                        note.id === id
                );

            await noteService.restoreNote(id);

            setTrashNotes(
                (prevTrashNotes) =>
                    prevTrashNotes.filter(
                        (note) =>
                            note.id !== id
                    )
            );

            if (restoredNote) {
                setNotes((prevNotes) => {
                    const alreadyExists =
                        prevNotes.some(
                            (note) =>
                                note.id === id
                        );

                    if (alreadyExists) {
                        return prevNotes;
                    }

                    return [
                        ...prevNotes,
                        restoredNote,
                    ];
                });
            }
        } catch (error) {
            console.error(
                'Failed to restore note:',
                error
            );
        }
    };

    /*
     *
     * Trash থেকে permanently delete করার function।
     */
    const permanentDeleteNote = async (
        id: string
    ) => {
        try {
            await noteService.permanentDeleteNote(
                id
            );

            setTrashNotes(
                (prevTrashNotes) =>
                    prevTrashNotes.filter(
                        (note) =>
                            note.id !== id
                    )
            );
        } catch (error) {
            console.error(
                'Failed to permanently delete note:',
                error
            );
        }
    };

    /*
     *
     * Notes Trash সম্পূর্ণ empty করার function।
     */
    const emptyTrash = async () => {
        try {
            await noteService.emptyTrash();

            setTrashNotes([]);
        } catch (error) {
            console.error(
                'Failed to empty note trash:',
                error
            );
        }
    };

    // পিন টগল হ্যান্ডলার
    const handleTogglePin = async (
        id: string,
        currentPinned: boolean
    ) => {
        try {
            await noteService.updateNote(id, {
                isPinned: !currentPinned,
            });

            const updated = notes.map(
                (note) =>
                    note.id === id
                        ? {
                            ...note,
                            isPinned:
                                !currentPinned,
                        }
                        : note
            );

            // পিন স্টেট চেঞ্জ হওয়ার সাথে সাথে রি-সর্ট করা
            updated.sort((a, b) => {
                if (
                    a.isPinned ===
                    b.isPinned
                ) {
                    return 0;
                }

                return a.isPinned
                    ? -1
                    : 1;
            });

            setNotes(updated);
        } catch (error) {
            console.error(
                'Failed to update pin status:',
                error
            );
        }
    };

    // ড্র্যাগ শুরু হলে ইডেক্স সেট করা, এখানে API call হচ্ছে না।
    // শুধু কোন item drag হচ্ছে সেটা memory-তে রাখা হচ্ছে।
    const handleDragStart = (
        index: number
    ) => {
        originalNotesRef.current = [
            ...notes,
        ];

        draggedItemIndexRef.current =
            index;

        notesRef.current = [
            ...notes,
        ];

        setDraggedItemIndex(index);
    };

    // ড্র্যাগ করার সময় নোটগুলোর লোকাল স্টেট ইনস্ট্যান্ট রিঅর্ডার করা,
    // এটাই মূল smooth reorder function।
    // কেন setNotes() functional form? ব্যবহার করেছি যাতে rapid dragover
    // event-এর সময় stale state-এর সমস্যা না হয়।
    // Drag & drop-এর সময় browser খুব দ্রুত অনেক dragover event fire করতে পারে।
    const handleDragOver = (
        e: React.DragEvent,
        index: number,
    ) => {
        e.preventDefault();

        const currentIndex =
            draggedItemIndexRef.current;

        if (
            currentIndex === null ||
            currentIndex === index
        ) {
            return;
        }

        const updatedNotes = [
            ...notesRef.current,
        ];

        const draggedNote =
            updatedNotes[currentIndex];

        if (!draggedNote) return;

        updatedNotes.splice(
            currentIndex,
            1
        );

        updatedNotes.splice(
            index,
            0,
            draggedNote
        );

        // Ref immediately update
        notesRef.current = updatedNotes;

        // UI immediately update
        setNotes(updatedNotes);

        draggedItemIndexRef.current =
            index;

        setDraggedItemIndex(index);
    };

    // ড্র্যাগ শেষ হলে নতুন পজিশন ব্যাকএন্ডে সেভ করা
    const handleDragEnd =
        async () => {
            if (draggedItemIndexRef.current === null) {
                return;
            }

            draggedItemIndexRef.current = null;

            setDraggedItemIndex(null);

            const currentNotes = notesRef.current;

            try {
                isReorderingRef.current = true;

                const reorderItems = currentNotes.map(
                    (
                        note, index
                    ) => ({
                        id: note.id,
                        position: index,
                    })
                );

                await noteService.reorderNotes(
                    reorderItems,
                    notebookId,
                );
            } catch (error) {
                console.error(
                    'Failed to save note order:',
                    error
                );

                const originalNotes = originalNotesRef.current;

                notesRef.current = originalNotes;

                setNotes(
                    originalNotes
                );
            } finally {
                isReorderingRef.current = false;
            }
        };

    return {
        loadingMore,
        hasMore,
        searchResults,
        searchLoading,
        notes,
        trashNotes,
        loading,
        trashLoading,
        hasLoaded,
        hasTrashLoaded,
        draggedItemIndex,
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
        restoreNote,
        permanentDeleteNote,
        emptyTrash,
        handleTogglePin,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        fetchNotes,
        fetchTrashNotes,
        loadMoreNotes,
    };

}

