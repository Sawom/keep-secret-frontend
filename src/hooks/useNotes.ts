import { useState, useEffect, useRef } from 'react';
import { noteService } from '@/services/note.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Note, useNotesStore } from '@/store/useNotesStore';

export function useNotes() {
    // 🔧 CHANGED: Notes এখন local useState-এ নয়, Zustand store-এ থাকবে।
    // Route change হলেও এই data memory-তে থাকবে।
    const notes = useNotesStore((state) => state.notes);
    const setNotes = useNotesStore((state) => state.setNotes);
    const hasLoaded = useNotesStore((state) => state.hasLoaded);

    // 🔧 CHANGED: Cache আগে থেকেই থাকলে প্রথম render থেকেই loading false থাকবে।
    const [loading, setLoading] = useState(!hasLoaded);

    const accessToken = useAuthStore((state) => state.accessToken);

    // ড্র্যাগ এন্ড ড্রপের জন্য স্টেট
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const notesRef = useRef<Note[]>([]);
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

    // 🔧 CHANGED: Zustand থেকে notes পরিবর্তন হলে drag/drop-এর ref-ও sync থাকবে।
    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    // কার্ডে ক্লিক করলে এডিট মোড ও মডাল ওপেন হবে
    const handleStartEdit = (note: Note) => {
        setEditingNoteId(note.id);
        setEditTitle(note.title || '');
        setEditBody(note.content || '');
    };

    // 🔧 CHANGED: Note update এখন Zustand cache-ও সাথে সাথে update করবে।
    // Backend save হওয়ার পর UI instantly update হবে এবং route change হলেও data থাকবে।
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

    // 🔧 CHANGED: Notes fetch এখন cache-aware।
    // Cache থাকলে loading spinner দেখাবে না।
    // API background-এ refresh হবে এবং fresh data Zustand-এ update হবে।
    const fetchNotes = async (isInitial = false) => {
        try {
            const currentHasLoaded =
                useNotesStore.getState().hasLoaded;

            /*
             * প্রথমবার কোনো data না থাকলে শুধু তখনই blocking
             * loading spinner দেখানো হবে।
             *
             * Route change করে ফিরে এলে cache থাকলে
             * existing data immediately দেখানো হবে।
             */
            if (!currentHasLoaded) {
                setLoading(true);
            }

            const response: any = await noteService.getNotes();

            const notesData = Array.isArray(response)
                ? response
                : response?.data ||
                response?.notes ||
                [];

            // পিন করা নোটগুলো সবসময় ওপরে এবং রিসেন্ট নোটগুলো সাজিয়ে রাখা
            // 🔧 CHANGED: spread ব্যবহার করা হয়েছে যাতে API response array mutate না হয়।
            const sortedNotes = [...notesData].sort(
                (a: Note, b: Note) => {
                    if (a.isPinned !== b.isPinned) {
                        return a.isPinned ? -1 : 1;
                    }

                    return a.position - b.position;
                }
            );

            notesRef.current = sortedNotes;

            // 🔧 CHANGED: Local state-এর পরিবর্তে Zustand cache update।
            setNotes(sortedNotes);
        } catch (error) {
            console.error('Failed to fetch notes:', error);

            /*
             * Background refresh fail করলেও existing cached
             * notes clear করা হবে না।
             */
        } finally {
            setLoading(false);
        }
    };

    // 🔧 CHANGED: Route remount হলেও cache থাকলে আর blocking loading হবে না।
    // Layout থেকে note-saved event এলে silent background refresh হবে।
    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        fetchNotes();

        // লেআউটে নতুন নোট সেভ হলে এই লিসেনার অটোমেটিক ফেচ করবে
        const handleNoteSaved = () => {
            fetchNotes();
        };

        window.addEventListener('note-saved', handleNoteSaved);

        return () => {
            window.removeEventListener(
                'note-saved',
                handleNoteSaved
            );
        };
    }, [accessToken]);

    // 🔧 CHANGED: Delete-এর পর Zustand cache থেকে note remove হবে।
    // Functional updater ব্যবহার করায় stale state-এর problem হবে না।
    const confirmDelete = async () => {
        if (!noteToDelete) return;

        try {
            await noteService.softDeleteNote(noteToDelete);

            setNotes((prevNotes) =>
                prevNotes.filter(
                    (note) => note.id !== noteToDelete
                )
            );

            setNoteToDelete(null);
        } catch (error) {
            console.error(
                'Failed to delete note:',
                error
            );
        }
    };

    // 🔧 CHANGED: Pin update Zustand cache-এ করা হচ্ছে।
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
    // 🔧 CHANGED: setNotes এখন Zustand store update করবে।
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

    // 🔧 CHANGED: Reorder fail করলে Zustand cache-এ আগের order restore হবে।
    // Backend save success হলে current Zustand state-ই থাকবে।
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
        loading,
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
        handleTogglePin,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
    };
}