'use client';

import { useState, useEffect, Suspense } from 'react';
import { noteService } from '@/services/note.service';
import { RotateCcw, Trash2, Loader2, SearchX } from 'lucide-react';

interface Note {
    id: string;
    title: string;
    content: string;
    color?: string;
    deletedAt?: string;
}

function TrashContent() {
    const [trashNotes, setTrashNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [noteToDeleteForever, setNoteToDeleteForever] = useState<string | null>(null);

    // ট্র্যাশের নোটগুলো ফেচ করার ফাংশন
    const fetchTrashNotes = async () => {
        try {
            setLoading(true);
            const response: any = await noteService.getTrashNotes();
            const notesData = Array.isArray(response) ? response : response?.data || response?.notes || [];
            setTrashNotes(notesData);
        } catch (error) {
            console.error('Failed to fetch trash notes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrashNotes();
    }, []);

    // ১. নোট রিস্টোর করার ফাংশন
    const handleRestore = async (id: string) => {
        try {
            await noteService.restoreNote(id);
            // সফলভাবে রিস্টোর হলে স্টেট থেকে বাদ দিয়ে দেবো
            setTrashNotes(trashNotes.filter((note) => note.id !== id));
        } catch (error) {
            console.error('Failed to restore note:', error);
        }
    };

    // ২. পাকাপাকিভাবে ডিলিট (Permanent Delete) করার ফাংশন
    const handlePermanentDelete = async () => {
        if (!noteToDeleteForever) return;
        try {
            await noteService.permanentDeleteNote(noteToDeleteForever);
            setTrashNotes(trashNotes.filter((note) => note.id !== noteToDeleteForever));
            setNoteToDeleteForever(null);
        } catch (error) {
            console.error('Failed to permanently delete note:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 relative">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Trash Notes (Items in trash are permanently deleted after some time)
                </h2>
            </div>

            {trashNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 space-y-3">
                    <SearchX className="w-12 h-12 stroke-[1.5]" />
                    <p className="text-base font-medium">Trash is empty</p>
                    <p className="text-xs text-zinc-400">Deleted notes will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {trashNotes.map((note) => (
                        <div
                            key={note.id}
                            style={{ backgroundColor: note.color || 'transparent' }}
                            className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 text-base">
                                    {note.title}
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-300 text-sm whitespace-pre-wrap line-clamp-6">
                                    {note.content}
                                </p>
                            </div>


                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                                <button
                                    onClick={() => handleRestore(note.id)}
                                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg transition-colors"
                                    title="Restore note"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>

                                <button
                                    onClick={() => setNoteToDeleteForever(note.id)}
                                    className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 px-2.5 py-1.5 rounded-lg transition-colors"
                                    title="Delete forever"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* পার্মানেন্ট ডিলিট কনফার্মেশন মডাল */}
            {noteToDeleteForever && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-80 shadow-xl space-y-4">
                        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                            Delete forever?
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            This note will be deleted permanently. You cannot undo this action.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setNoteToDeleteForever(null)}
                                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePermanentDelete}
                                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// নেক্সট জেএস সাসপেন্স বাউন্ডারি সহ এক্সপোর্ট
export default function TrashPage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
            }
        >
            <TrashContent />
        </Suspense>
    );
}