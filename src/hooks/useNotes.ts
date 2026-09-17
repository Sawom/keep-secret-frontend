import { useState, useEffect, useRef, useCallback } from 'react';
import { noteService } from '@/services/note.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotesStore, Note } from '@/store/useNotesStore';

export function useNotes() {
    /*
     * 🔧 CHANGED:
     *
     * Notes আর শুধু hook-এর local state-এ থাকবে না।
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

    const accessToken = useAuthStore(
        (state) => state.accessToken
    );

    /*
     * 🔧 CHANGED:
     *
     * Cached data থাকলে প্রথম render থেকেই data দেখানো হবে।
     * তাই route change-এর সময় আবার full-page loading spinner
     * দেখানো হবে না।
     */
    const [loading, setLoading] = useState(
        !hasLoaded && !!accessToken
    );

    const [trashLoading, setTrashLoading] = useState(
        !hasTrashLoaded && !!accessToken
    );

    // ড্র্যাগ এন্ড ড্রপের জন্য স্টেট
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    const notesRef = useRef<Note[]>(notes);
    const draggedItemIndexRef = useRef<number | null>(null);
    const originalNotesRef = useRef<Note[]>([]);
    const isReorderingRef = useRef(false);

    // ডিলিট কনফার্মেশন পপআপের জন্য স্টেট
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

    // edit and save states
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editBody, setEditBody] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // ডাবল রিকোয়েস্ট রোধ করার জন্য useRef ব্যবহার করা হলো
    const isUpdatingRef = useRef(false);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    /*
     * 🔧 CHANGED:
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

            await noteService.updateNote(editingNoteId, {
                title: editTitle,
                content: editBody,
            });

            // লোকাল স্টেট আপডেট করা যাতে UI ও ডেট সাথে সাথে রিফ্লেক্ট করে
            setNotes((prevNotes) =>
                prevNotes.map((note) =>
                    note.id === editingNoteId
                        ? {
                            ...note,
                            title: editTitle,
                            content: editBody,
                            updatedAt: new Date().toISOString(),
                        }
                        : note
                )
            );
        } catch (error) {
            console.error('Failed to update note:', error);
        } finally {
            isUpdatingRef.current = false;
            setIsUpdating(false);
        }
    };

    // ১০ সেকেন্ডের ডিবাউন্স অটো-সেভ
    useEffect(() => {
        if (!editingNoteId) return;

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            handleSaveEdit();
        }, 10000); // ১০ সেকেন্ড

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [editTitle, editBody, editingNoteId]);

    // ক্লোজ করার ফাংশন
    const handleCloseModal = async () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }

        // মোডাল বন্ধ করার সময় ফাইনাল সেভ কল করা হবে
        await handleSaveEdit();

        setEditingNoteId(null);
    };

    // ১. নোট ফেচ করা
    const fetchNotes = useCallback(
        async (isInitial = false) => {
            if (!accessToken) {
                setLoading(false);
                return;
            }

            try {
                /*
                 * 🔧 CHANGED:
                 *
                 * প্রথমবার কোনো cached data না থাকলে spinner দেখানো হবে।
                 *
                 * কিন্তু Zustand-এ আগের data থাকলে loading=true করা হবে না।
                 * ফলে route change-এর সময় আগের data screen-এ থাকবে।
                 */
                if (isInitial && !hasLoaded) {
                    setLoading(true);
                }

                const response: any =
                    await noteService.getNotes();

                const notesData = Array.isArray(response)
                    ? response
                    : response?.data ||
                    response?.notes ||
                    [];

                // পিন করা নোটগুলো সবসময় ওপরে এবং রিসেন্ট নোটগুলো সাজিয়ে রাখা
                const sortedNotes = [...notesData].sort(
                    (a: Note, b: Note) => {
                        if (a.isPinned !== b.isPinned) {
                            return a.isPinned ? -1 : 1;
                        }

                        return a.position - b.position;
                    }
                );

                notesRef.current = sortedNotes;

                /*
                 * 🔧 CHANGED:
                 *
                 * Local setNotes-এর পরিবর্তে Zustand store update করা হচ্ছে।
                 * এতে route change হলেও data memory-তে থাকবে।
                 */
                setNotes(sortedNotes);
            } catch (error) {
                console.error(
                    'Failed to fetch notes:',
                    error
                );

                /*
                 * 🔧 CHANGED:
                 *
                 * Backend request fail করলেও cached data থাকলে
                 * সেটা screen থেকে remove করা হবে না।
                 */
            } finally {
                setLoading(false);
            }
        },
        [
            accessToken,
            hasLoaded,
            setNotes,
        ]
    );

    // ২. ট্র্যাশের নোটগুলো ফেচ করা
    const fetchTrashNotes = useCallback(
        async (isInitial = false) => {
            if (!accessToken) {
                setTrashLoading(false);
                return;
            }

            try {
                /*
                 * 🔧 CHANGED:
                 *
                 * Trash cache আগে থেকেই থাকলে route change-এর সময়
                 * নতুন spinner দেখানো হবে না।
                 */
                if (isInitial && !hasTrashLoaded) {
                    setTrashLoading(true);
                }

                const response: any =
                    await noteService.getTrashNotes();

                const trashData = Array.isArray(response)
                    ? response
                    : response?.data ||
                    response?.notes ||
                    [];

                /*
                 * 🔧 CHANGED:
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
            accessToken,
            hasTrashLoaded,
            setTrashNotes,
        ]
    );

    // পেজ লোড ও ইভেন্ট শোনার জন্য useEffect
    useEffect(() => {
        // টোকেন না থাকলে লোডিং ফলস করে দেব যাতে সারাক্ষণ লোডিং হয়ে না থাকে
        if (!accessToken) {
            setLoading(false);
            setTrashLoading(false);
            return;
        }

        /*
         * 🔧 CHANGED:
         *
         * Zustand cache থাকলে cached data already UI-তে থাকবে।
         * এরপর backend থেকে background refresh হবে।
         *
         * প্রথমবার data না থাকলে শুধু spinner দেখাবে।
         */
        fetchNotes(!hasLoaded);

        // লেআউটে নতুন নোট সেভ হলে এই লিসেনার অটোমেটিক ফেচ করবে
        const handleNoteSaved = () => {
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
        accessToken,
        hasLoaded,
        fetchNotes,
    ]);

    /*
     * 🔧 CHANGED:
     *
     * Trash page-এ গেলে trash data fetch হবে।
     *
     * যদি cache থাকে তাহলে প্রথমে cached data দেখাবে এবং
     * background-এ backend থেকে fresh data আনবে।
     */
    useEffect(() => {
        if (!accessToken) {
            setTrashLoading(false);
            return;
        }

        fetchTrashNotes(!hasTrashLoaded);
    }, [
        accessToken,
        hasTrashLoaded,
        fetchTrashNotes,
    ]);

    // কনফার্মেশনের পর সফট ডিলিট হ্যান্ডলার
    const confirmDelete = async () => {
        if (!noteToDelete) return;

        try {
            /*
             * 🔧 CHANGED:
             *
             * Delete করার আগে note object বের করে রাখছি,
             * যাতে backend success হওয়ার পরে সেটাকে Trash cache-এ
             * instantly যোগ করা যায়।
             */
            const deletedNote = notes.find(
                (note) => note.id === noteToDelete
            );

            await noteService.softDeleteNote(
                noteToDelete
            );

            /*
             * 🔧 CHANGED:
             *
             * Active notes cache থেকে note remove করা হচ্ছে।
             */
            setNotes((prevNotes) =>
                prevNotes.filter(
                    (note) => note.id !== noteToDelete
                )
            );

            /*
             * 🔧 CHANGED:
             *
             * Backend delete successful হওয়ার পর একই note
             * Trash cache-এ instantly যোগ করা হচ্ছে।
             *
             * Backend পরে fresh data দিলে সেটাও replace হবে।
             */
            if (deletedNote) {
                setTrashNotes((prevTrashNotes) => [
                    deletedNote,
                    ...prevTrashNotes.filter(
                        (note) =>
                            note.id !== noteToDelete
                    ),
                ]);
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
     * 🔧 CHANGED:
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
                    (note) => note.id === id
                );

            await noteService.restoreNote(id);

            setTrashNotes((prevTrashNotes) =>
                prevTrashNotes.filter(
                    (note) => note.id !== id
                )
            );

            if (restoredNote) {
                setNotes((prevNotes) => {
                    const alreadyExists =
                        prevNotes.some(
                            (note) => note.id === id
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
     * 🔧 CHANGED:
     *
     * Trash থেকে permanently delete করার function।
     */
    const permanentDeleteNote = async (
        id: string
    ) => {
        try {
            await noteService.permanentDeleteNote(id);

            setTrashNotes((prevTrashNotes) =>
                prevTrashNotes.filter(
                    (note) => note.id !== id
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
     * 🔧 CHANGED:
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

            const updated = notes.map((note) =>
                note.id === id
                    ? {
                        ...note,
                        isPinned: !currentPinned,
                    }
                    : note
            );

            // পিন স্টেট চেঞ্জ হওয়ার সাথে সাথে রি-সর্ট করা
            updated.sort((a, b) => {
                if (a.isPinned === b.isPinned) {
                    return 0;
                }

                return a.isPinned ? -1 : 1;
            });

            setNotes(updated);
        } catch (error) {
            console.error(
                'Failed to update pin status:',
                error
            );
        }
    };

    // ড্র্যাগ শুরু হলে ইডেক্স সেট করা, এখানে API call হচ্ছে না। শুধু কোন item drag হচ্ছে সেটা memory-তে রাখা হচ্ছে।
    const handleDragStart = (index: number) => {
        originalNotesRef.current = [...notes];

        draggedItemIndexRef.current = index;

        notesRef.current = [...notes];

        setDraggedItemIndex(index);
    };

    // ড্র্যাগ করার সময় নোটগুলোর লোকাল স্টেট ইনস্ট্যান্ট রিঅর্ডার করা, এটাই মূল smooth reorder function।
    // কেন setNotes() functional form? ব্যবহার করেছি যাতে rapid dragover event-এর সময় stale state-এর সমস্যা না হয়। 
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

        draggedItemIndexRef.current = index;
        setDraggedItemIndex(index);
    };

    // ড্র্যাগ শেষ হলে নতুন পজিশন ব্যাকএন্ডে সেভ করা
    const handleDragEnd = async () => {
        if (
            draggedItemIndexRef.current === null
        ) {
            return;
        }

        // Drag শেষ
        draggedItemIndexRef.current = null;
        setDraggedItemIndex(null);

        const currentNotes =
            notesRef.current;

        try {
            isReorderingRef.current = true;

            const reorderItems =
                currentNotes.map(
                    (note, index) => ({
                        id: note.id,
                        position: index,
                    })
                );

            await noteService.reorderNotes(
                reorderItems
            );
        } catch (error) {
            console.error(
                'Failed to save note order:',
                error
            );

            // Backend save fail করলে আগের order restore
            const originalNotes =
                originalNotesRef.current;

            notesRef.current =
                originalNotes;

            setNotes(originalNotes);
        } finally {
            isReorderingRef.current =
                false;
        }
    };

    return {
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
    };
    
}