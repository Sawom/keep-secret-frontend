import { useState, useEffect, useRef } from 'react';
import { noteService } from '@/services/note.service';
import { useAuthStore } from '@/store/useAuthStore';

interface Note {
    id: string;
    title: string;
    content: string;
    color?: string;
    isPinned: boolean;
    updatedAt: string;
}

export function useNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const accessToken = useAuthStore((state) => state.accessToken);

    // ড্র্যাগ এন্ড ড্রপের জন্য স্টেট
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    // ডিলিট কনফার্মেশন পপআপের জন্য স্টেট
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

    // edit and save states
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editBody, setEditBody] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
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
            // লোকাল স্টেট আপডেট করা যাতে UI সাথে সাথে রিফ্লেক্ট করে
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
        }
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

    // ড্র্যাগ এন্ড ড্রপ লজিক
    const handleDragStart = (index: number) => {
        setDraggedItemIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const updatedNotes = [...notes];
        const draggedItem = updatedNotes[draggedItemIndex];
        updatedNotes.splice(draggedItemIndex, 1);
        updatedNotes.splice(index, 0, draggedItem);

        setDraggedItemIndex(index);
        setNotes(updatedNotes);
    };

    const handleDragEnd = () => {
        setDraggedItemIndex(null);
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