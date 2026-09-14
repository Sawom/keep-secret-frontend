'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { noteService } from '@/services/note.service';
import { Pin, Trash2, Palette, Loader2, SearchX, GripVertical } from 'lucide-react';

interface Note {
    id: string;
    title: string;
    content: string;
    color?: string;
    isPinned: boolean;
    updatedAt: string;
}

// আসল নোট পেজের লজিক ও ইউআই অংশ
function NotesContent() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    // ড্র্যাগ এন্ড ড্রপের জন্য স্টেট
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    // ডিলিট কনফার্মেশন পপআপের জন্য স্টেট
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    // এখানে কোনো সার্চ বার বা সার্চ ইনপুট নেই। এখানে শুধু URL থেকে সার্চ কুয়েরিটা ধরা হবে (useSearchParams) এবং ব্যাকএন্ড থেকে আনা নোটগুলোর সাথে ম্যাচ করে ফিল্টার করা হবে:
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';

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

    useEffect(() => {
        fetchNotes();
    }, []);

    // কনফার্মেশনের পর সফট ডিলিট হ্যান্ডলার
    const confirmDelete = async () => {
        if (!noteToDelete) return;
        try {
            await noteService.softDeleteNote(noteToDelete);
            setNotes(notes.filter((note) => note.id !== noteToDelete));
            setNoteToDelete(null); // পপআপ বন্ধ করা
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    };

    // পিন টগল হ্যান্ডলার (পিন করলে ওপরে চলে যাবে)
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

    // সার্চ ফিল্টারিং
    const filteredNotes = notes.filter(
        (note) =>
            note.title.toLowerCase().includes(searchQuery) ||
            note.content.toLowerCase().includes(searchQuery)
    );

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
                    {searchQuery ? `Search results for "${searchQuery}"` : 'All Notes (Drag to reorder)'}
                </h2>
            </div>

            {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 space-y-3">
                    <SearchX className="w-12 h-12 stroke-[1.5]" />
                    <p className="text-base font-medium">No matching notes found</p>
                    <p className="text-xs text-zinc-400">Try searching with a different keyword.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredNotes.map((note, index) => {
                        // কালারটি হোয়াইট বা ফাঁকা কি না তা নিখুঁতভাবে চেক করার জন্য
                        const rawColor = note.color?.toLowerCase()?.trim();
                        const isDefaultColor = !rawColor || rawColor === '#ffffff' || rawColor === '#fff' || rawColor === 'white' || rawColor === 'transparent';

                        return (
                            <div
                                key={note.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                style={{ backgroundColor: isDefaultColor ? undefined : note.color }}
                                className={`group relative rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-default border ${isDefaultColor
                                    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                    : 'border-black/10 dark:border-white/20 text-zinc-900 dark:text-zinc-100'
                                    }`}
                            >
                                {/* Drag Handle & Pin Button */}
                                <div className="absolute top-3 right-3 flex items-center gap-1">
                                    <span className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-zinc-400 p-1">
                                        <GripVertical className="w-4 h-4" />
                                    </span>
                                    <button
                                        onClick={() => handleTogglePin(note.id, note.isPinned)}
                                        className={`p-1.5 rounded-full transition-opacity ${note.isPinned
                                            ? 'opacity-100 text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                                            : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                            }`}
                                        title={note.isPinned ? 'Unpin note' : 'Pin note'}
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

                                {/* Card Footer Actions */}
                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setNoteToDelete(note.id)}
                                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 rounded-full transition-colors"
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
                                onClick={() => setNoteToDelete(null)}
                                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
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

// মূল এক্সপোর্ট পেজ যা Suspense দিয়ে মোড়ানো থাকবে (Vercel Build Error এড়ানোর জন্য)
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