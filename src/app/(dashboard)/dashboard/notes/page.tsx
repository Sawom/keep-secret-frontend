'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { noteService } from '@/services/note.service';
import { Pin, Trash2, Palette, Loader2, SearchX, GripVertical, Archive, MoreVertical, Bell, CheckSquare, UserPlus, ImageIcon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

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
    const accessToken = useAuthStore((state) => state.accessToken);

    // ড্র্যাগ এন্ড ড্রপের জন্য স্টেট
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    // ডিলিট কনফার্মেশন পপআপের জন্য স্টেট
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    // এখানে কোনো সার্চ বার বা সার্চ ইনপুট নেই। এখানে শুধু URL থেকে সার্চ কুয়েরিটা ধরা হবে (useSearchParams) এবং ব্যাকএন্ড থেকে আনা নোটগুলোর সাথে ম্যাচ করে ফিল্টার করা হবে:
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';

    // edit and save
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

    // ২. ১০ সেকেন্ডের ডিবাউন্স অটো-সেভ
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

    // ৩. ক্লোজ করার ফাংশন
    const handleCloseModal = async () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current); // টাইমার ক্লিয়ার করা
        }
        await handleSaveEdit(); // বন্ধ করার আগে ফাইনাল সেভ করে নেওয়া
        setEditingNoteId(null); // মডাল বন্ধ করা
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

    // পেজ লোড ও ইভেন্ট শোনার জন্য নতুন useEffect
    useEffect(() => {
        if (!accessToken) return;

        // ১. প্রথমবার নোট ফেচ করা
        fetchNotes();

        // ২. লেআউটে নতুন নোট সেভ হলে এই লিসেনার অটোমেটিক ফেচ করবে
        const handleNoteSaved = () => {
            fetchNotes();
        };

        window.addEventListener('note-saved', handleNoteSaved);

        // ৩. ক্লিনআপ
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                    {filteredNotes.map((note, index) => {
                        const rawColor = note.color?.toLowerCase()?.trim();
                        const isDefaultColor = !rawColor || rawColor === '#ffffff' || rawColor === '#fff' || rawColor === 'white' || rawColor === 'transparent';

                        return (
                            <div
                                key={note.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleStartEdit(note)} // ক্লিক করলে কার্ডটি মডালে রূপান্তর হবে
                                style={{ backgroundColor: isDefaultColor ? undefined : note.color }}
                                className={`group relative rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border cursor-pointer ${isDefaultColor
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTogglePin(note.id, note.isPinned);
                                        }}
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

                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNoteToDelete(note.id);
                                        }}
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

            {/* edit component modal */}
            {editingNoteId && (() => {
                const activeNote = filteredNotes.find(n => n.id === editingNoteId);
                if (!activeNote) return null;
                const rawColor = activeNote?.color?.toLowerCase()?.trim();
                const isDefaultColor = !rawColor || rawColor === '#ffffff' || rawColor === '#fff' || rawColor === 'white' || rawColor === 'transparent';

                return (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
                    >
                        <div
                            style={{ backgroundColor: isDefaultColor ? undefined : activeNote?.color }}
                            className={`relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 border ${isDefaultColor
                                ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                                : 'border-black/10 dark:border-white/20 text-zinc-900 dark:text-zinc-100'
                                }`}
                            onClick={(e) => e.stopPropagation()} // মডালের ভেতরে ক্লিক করলে যাতে বন্ধ না হয়ে যায়
                        >
                            {/* Top-Right Pin Button inside Modal */}
                            <div className="absolute top-4 right-4">
                                <button
                                    type="button"
                                    onClick={() => handleTogglePin(activeNote.id, activeNote.isPinned)}
                                    className={`p-1.5 rounded-full transition-colors ${activeNote?.isPinned
                                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                                        : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                    title={activeNote?.isPinned ? 'Unpin note' : 'Pin note'}
                                >
                                    <Pin className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Note Title Input */}
                            <input
                                type="text"
                                placeholder="Title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full pr-10 bg-transparent border-none outline-none font-semibold text-zinc-800 dark:text-zinc-100 text-lg"
                                autoFocus
                                required
                            />

                            {/* Note Body Textarea */}
                            <textarea
                                placeholder="Take a note..."
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                rows={6}
                                className="w-full bg-transparent border-none outline-none text-base text-zinc-700 dark:text-zinc-300 resize-none max-h-96 overflow-y-[field-sizing:content] [field-sizing:content]"
                                required
                            />

                            {/* Footer Toolbar & Buttons */}
                            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                                    <button type="button" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full" title="Remind me"><Bell className="w-4 h-4" /></button>
                                    <button type="button" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full" title="Collaborator"><UserPlus className="w-4 h-4" /></button>
                                    <button type="button" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full" title="Change Color"><Palette className="w-4 h-4" /></button>
                                    <button type="button" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full" title="Add Image"><ImageIcon className="w-4 h-4" /></button>
                                    <button type="button" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full" title="Archive"><Archive className="w-4 h-4" /></button>
                                    <button type="button" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full" title="More"><MoreVertical className="w-4 h-4" /></button>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Save / Update Indicator */}
                                    {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}

                                    {/* Save Button (ক্লিক করলে শুধু সেভ হবে, মডাল খোলা থাকবে) */}
                                    <button
                                        type="button"
                                        onClick={handleSaveEdit}
                                        disabled={isUpdating}
                                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                        <CheckSquare className="w-4 h-4" /> Save
                                    </button>

                                    {/* Close Button (ক্লিক করলে সেভ হয়ে মডাল বন্ধ হবে) */}
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={isUpdating}
                                        className="px-6 py-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                    >
                                        Close
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