import { useState, useEffect, useRef } from 'react';
import { noteService } from '@/services/note.service';
import { useAuthStore } from '@/store/useAuthStore';

interface Note {
    id: string;
    title: string;
    content: string;
    color?: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
}

export function useNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
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

    // কার্ডে ক্লিক করলে এডিট মোড ও মডাল ওপেন হবে
    const handleStartEdit = (note: any) => {
        setEditingNoteId(note.id);
        setEditTitle(note.title || '');
        setEditBody(note.content || '');
    };

    // সেভ এবং ক্লোজ করার ফাংশন
    const handleSaveEdit = async () => {
        if (!editingNoteId) return;
        try {
            setIsUpdating(true);
            await noteService.updateNote(editingNoteId, {
                title: editTitle,
                content: editBody,
            });
            // লোকাল স্টেট আপডেট করা যাতে UI ও ডেট সাথে সাথে রিফ্লেক্ট করে
            setNotes((prevNotes) =>
                prevNotes.map((note) =>
                    note.id === editingNoteId
                        ? { ...note, title: editTitle, content: editBody, updatedAt: new Date().toISOString() }
                        : note
                )
            );
        } catch (error) {
            console.error('Failed to update note:', error);
        } finally {
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

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response: any = await noteService.getNotes();
            const notesData = Array.isArray(response) ? response : response?.data || response?.notes || [];
            // পিন করা নোটগুলো সবসময় ওপরে এবং রিসেন্ট নোটগুলো সাজিয়ে রাখা
            const sortedNotes = notesData.sort((a: Note, b: Note) => {
                if (a.isPinned === b.isPinned) {
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                }
                return a.isPinned ? -1 : 1;
            });
            setNotes(sortedNotes);
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        } finally {
            setLoading(false);
        }
    };

    // পেজ লোড ও ইভেন্ট শোনার জন্য useEffect
    useEffect(() => {
        if (!accessToken) return;

        // ১. প্রথমবার নোট ফেচ করা
        fetchNotes();

        // ২. লেআউটে নতুন নোট সেভ হলে এই লিসেনার অটোমেটিক ফেচ করবে
        const handleNoteSaved = () => {
            fetchNotes();
        };

        window.addEventListener('note-saved', handleNoteSaved);

        return () => {
            window.removeEventListener('note-saved', handleNoteSaved);
        };
    }, [accessToken]);

    // কনফার্মেশনের পর সফট ডিলিট হ্যান্ডলার
    const confirmDelete = async () => {
        if (!noteToDelete) return;
        try {
            await noteService.softDeleteNote(noteToDelete);
            setNotes(notes.filter((note) => note.id !== noteToDelete));
            setNoteToDelete(null);
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    };

    // পিন টগল হ্যান্ডলার
    const handleTogglePin = async (id: string, currentPinned: boolean) => {
        try {
            await noteService.updateNote(id, { isPinned: !currentPinned });
            const updated = notes.map((note) =>
                note.id === id ? { ...note, isPinned: !currentPinned } : note
            );
            // পিন স্টেট চেঞ্জ হওয়ার সাথে সাথে রি-সর্ট করা
            updated.sort((a, b) => {
                if (a.isPinned === b.isPinned) return 0;
                return a.isPinned ? -1 : 1;
            });
            setNotes(updated);
        } catch (error) {
            console.error('Failed to update pin status:', error);
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

        const currentIndex = draggedItemIndexRef.current;

        if (currentIndex === null || currentIndex === index) {
            return;
        }

        const updatedNotes = [...notesRef.current];

        const draggedNote = updatedNotes[currentIndex];

        if (!draggedNote) return;

        updatedNotes.splice(currentIndex, 1);
        updatedNotes.splice(index, 0, draggedNote);

        // Ref immediately update
        notesRef.current = updatedNotes;

        // UI immediately update
        setNotes(updatedNotes);

        draggedItemIndexRef.current = index;
        setDraggedItemIndex(index);
    };

    // ড্র্যাগ শেষ হলে নতুন পজিশন ব্যাকএন্ডে সেভ করা
    const handleDragEnd = async () => {
        if (draggedItemIndexRef.current === null) {
            return;
        }

        // Drag শেষ
        draggedItemIndexRef.current = null;
        setDraggedItemIndex(null);

        const currentNotes = notesRef.current;

        try {
            isReorderingRef.current = true;

            const reorderItems = currentNotes.map((note, index) => ({
                id: note.id,
                position: index,
            }));

            await noteService.reorderNotes(reorderItems);
        } catch (error) {
            console.error('Failed to save note order:', error);

            // Backend save fail করলে আগের order restore
            const originalNotes = originalNotesRef.current;

            notesRef.current = originalNotes;
            setNotes(originalNotes);
        } finally {
            isReorderingRef.current = false;
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