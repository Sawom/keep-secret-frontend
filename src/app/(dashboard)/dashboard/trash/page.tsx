'use client';

import { useState, Suspense } from 'react';
import { noteService } from '@/services/note.service';
import { RotateCcw, Trash2, Loader2, SearchX, Folder } from 'lucide-react';
import { notebookService } from '@/services/notebook.service';
import { useTrash } from './../../../../hooks/useTrash';

function TrashContent() {
    const {
        notes: trashNotes,
        notebooks: trashNotebooks,
        loading,
        emptyTrash,
        removeNote,
        removeNotebook,
    } = useTrash();

    const [noteToDeleteForever, setNoteToDeleteForever] =
        useState<string | null>(null);

    const [notebookToDeleteForever, setNotebookToDeleteForever] =
        useState<string | null>(null);

    const [emptyingTrash, setEmptyingTrash] =
        useState(false);

    /*
     * Note restore করার function।
     *
     * Restore সফল হলে useTrash store থেকে
     * note remove করে দেওয়া হবে।
     */
    const handleRestoreNote = async (id: string) => {
        try {
            await noteService.restoreNote(id);

            removeNote(id);
        } catch (error) {
            console.error(
                'Failed to restore note:',
                error
            );
        }
    };

    /*
     * Notebook restore করার function।
     *
     * Restore সফল হলে useTrash store থেকে
     * notebook remove করে দেওয়া হবে।
     */
    const handleRestoreNotebook = async (id: string) => {
        try {
            await notebookService.restoreNotebook(id);

            removeNotebook(id);
        } catch (error) {
            console.error(
                'Failed to restore notebook:',
                error
            );
        }
    };

    /*
     * Note permanently delete করার function।
     */
    const handlePermanentDeleteNote = async () => {
        if (!noteToDeleteForever) return;

        try {
            await noteService.permanentDeleteNote(
                noteToDeleteForever
            );

            removeNote(noteToDeleteForever);

            setNoteToDeleteForever(null);
        } catch (error) {
            console.error(
                'Failed to permanently delete note:',
                error
            );
        }
    };

    /*
     * Notebook permanently delete করার function।
     */
    const handlePermanentDeleteNotebook = async () => {
        if (!notebookToDeleteForever) return;

        try {
            await notebookService.permanentDeleteNotebook(
                notebookToDeleteForever
            );

            removeNotebook(
                notebookToDeleteForever
            );

            setNotebookToDeleteForever(null);
        } catch (error) {
            console.error(
                'Failed to permanently delete notebook:',
                error
            );
        }
    };

    /*
     * Notes + Notebooks একসাথে permanently delete করবে।
     * Backend-এর:
     * DELETE /trash/empty
     * একবারই call হবে।
     */
    const handleEmptyTrash = async () => {
        if (
            trashNotes.length === 0 &&
            trashNotebooks.length === 0
        ) {
            return;
        }

        try {
            setEmptyingTrash(true);

            const success = await emptyTrash();

            if (!success) {
                return;
            }
        } catch (error) {
            console.error(
                'Failed to empty trash:',
                error
            );
        } finally {
            setEmptyingTrash(false);
        }
    };

    const hasTrash =
        trashNotes.length > 0 ||
        trashNotebooks.length > 0;

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
                    Trash Notes & Notebooks (Items in trash are permanently deleted after 30 days)
                </h2>

                {hasTrash && (
                    <button
                        onClick={handleEmptyTrash}
                        disabled={emptyingTrash}
                        className="flex items-center cursor-pointer gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Empty Trash"
                    >
                        {emptyingTrash ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>

            {!hasTrash ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 space-y-3">
                    <SearchX className="w-12 h-12 stroke-[1.5]" />

                    <p className="text-base font-medium">
                        Trash is empty
                    </p>

                    <p className="text-xs text-zinc-400">
                        Deleted notes and notebooks will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                    {/* TRASHED NOTES */}

                    {trashNotes.map((note) => {
                        const rawColor =
                            note.color?.toLowerCase()?.trim();

                        const isDefaultColor =
                            !rawColor ||
                            rawColor === '#ffffff' ||
                            rawColor === '#fff' ||
                            rawColor === 'white' ||
                            rawColor === 'transparent';

                        return (
                            <div
                                key={`note-${note.id}`}
                                style={{
                                    backgroundColor:
                                        isDefaultColor
                                            ? undefined
                                            : note.color,
                                }}
                                className={`group relative rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border ${isDefaultColor
                                    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                    : 'border-black/10 dark:border-white/20 text-zinc-900 dark:text-zinc-100'
                                    }`}
                            >
                                <div className="space-y-2">
                                    <h3 className="font-semibold truncate text-zinc-800 dark:text-zinc-100 text-base">
                                        {note.title}
                                    </h3>

                                    <p className="text-zinc-600 dark:text-zinc-300 text-sm whitespace-pre-wrap line-clamp-6">
                                        {note.content}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                                    <button
                                        onClick={() =>
                                            handleRestoreNote(
                                                note.id
                                            )
                                        }

                                        className="flex items-center cursor-pointer gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg transition-colors"
                                        title="Restore note"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        onClick={() =>
                                            setNoteToDeleteForever(
                                                note.id
                                            )
                                        }

                                        className="p-2 text-zinc-400 cursor-pointer hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                        title="Delete Forever"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* TRASHED NOTEBOOKS */}

                    {trashNotebooks.map((notebook) => {
                        const rawColor =
                            notebook.color?.toLowerCase()?.trim();

                        const isDefaultColor =
                            !rawColor ||
                            rawColor === '#ffffff' ||
                            rawColor === '#fff' ||
                            rawColor === 'white' ||
                            rawColor === 'transparent';

                        return (
                            <div
                                key={`notebook-${notebook.id}`}
                                className={`group relative rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border ${isDefaultColor
                                    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                    : 'border-black/10 dark:border-white/20 text-zinc-900 dark:text-zinc-100'
                                    }`}
                            >
                                {/* folder */}
                                <div className='flex items-start mb-3'>
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                                        style={{ backgroundColor: isDefaultColor ? undefined : notebook.color }}
                                    >
                                        <Folder className="w-5 h-5" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold truncate text-zinc-800 dark:text-zinc-100 text-base">
                                        {notebook.title}
                                    </h3>

                                    <p className="text-zinc-600 dark:text-zinc-300 text-sm whitespace-pre-wrap line-clamp-6">
                                        {notebook.description || 'Notebook'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                                    <button
                                        onClick={() =>
                                            handleRestoreNotebook(
                                                notebook.id
                                            )
                                        }

                                        className="flex items-center cursor-pointer gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg transition-colors"
                                        title="Restore notebook"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        onClick={() =>
                                            setNotebookToDeleteForever(
                                                notebook.id
                                            )
                                        }

                                        className="p-2 text-zinc-400 cursor-pointer hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                        title="Delete Forever"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* NOTE PERMANENT DELETE MODAL */}

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
                                onClick={() =>
                                    setNoteToDeleteForever(null)
                                }
                                className="px-4 py-2 text-sm font-medium cursor-pointer text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={
                                    handlePermanentDeleteNote
                                }
                                className="px-4 py-2 text-sm font-medium cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTEBOOK PERMANENT DELETE MODAL */}

            {notebookToDeleteForever && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-80 shadow-xl space-y-4">
                        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                            Delete forever?
                        </h3>

                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            This notebook and its trashed notes will be deleted permanently. You cannot undo this action.
                        </p>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() =>
                                    setNotebookToDeleteForever(null)
                                }
                                className="px-4 py-2 text-sm font-medium cursor-pointer text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={
                                    handlePermanentDeleteNotebook
                                }
                                className="px-4 py-2 cursor-pointer text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
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