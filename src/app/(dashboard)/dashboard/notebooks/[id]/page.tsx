'use client';

import React, { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Loader2,
    Pin,
    Trash2,
    GripVertical,
    CheckSquare,
    SearchX,
    Check,
    Square,
    SquareX,
    X,
} from 'lucide-react';

import { useNotebooks } from '@/hooks/useNotebooks';
import { useNotes } from '@/hooks/useNotes';
import { noteService } from '@/services/note.service';
import type { Notebook } from '@/services/notebook.service';

export default function SingleNotebookPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: notebookId } = use(params);

    const { getNotebookById } = useNotebooks();

    const {
        notes,
        loading,
        loadingMore,
        hasMore,
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

        // Reuse the existing bulk-trash function from useNotes.
        bulkTrashNotes,
    } = useNotes('', notebookId);

    const [notebook, setNotebook] = useState<Notebook | null>(null);

    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // Notebook note composer state.
    const [isNoteExpanded, setIsNoteExpanded] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteBody, setNoteBody] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isSavingRef = useRef(false);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Bulk-selection state local to notebook view.
    const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
    const [showBulkTrashConfirm, setShowBulkTrashConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [bulkDeleteError, setBulkDeleteError] = useState('');

    // Load the current notebook.
    useEffect(() => {
        let cancelled = false;

        const loadNotebook = async () => {
            try {
                const data = await getNotebookById(notebookId);

                if (!cancelled) {
                    setNotebook(data);
                }
            } catch (error) {
                console.error('Failed to load notebook:', error);
            }
        };

        void loadNotebook();

        return () => {
            cancelled = true;
        };
    }, [notebookId, getNotebookById]);

    // Infinite scrolling for notebook notes.
    useEffect(() => {
        if (loading || loadingMore || !hasMore) return;

        const element = loadMoreRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    void loadMoreNotes();
                }
            },
            { rootMargin: '600px' },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [loading, loadingMore, hasMore, loadMoreNotes]);

    // Create a note inside this notebook using the existing note service.
    const handleSaveNote = async () => {
        if (!noteTitle.trim() && !noteBody.trim()) return;

        if (isSavingRef.current) return;

        isSavingRef.current = true;
        setIsSaving(true);

        try {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }

            await noteService.createNote({
                title: noteTitle.trim() || 'Untitled Note',
                content: noteBody.trim(),
                color: '#FFFFFF',
                isPinned: false,
                notebookId,
            });

            setNoteTitle('');
            setNoteBody('');
            setIsNoteExpanded(false);

            // Notify useNotes so the current notebook can refresh its notes.
            window.dispatchEvent(new CustomEvent('note-saved'));
        } catch (error) {
            console.error('Failed to save notebook note:', error);
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    };

    // Auto-save draft after the user stops editing for 10 seconds.
    useEffect(() => {
        if (
            !isNoteExpanded ||
            (!noteTitle.trim() && !noteBody.trim())
        ) {
            return;
        }

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            void handleSaveNote();
        }, 10000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [noteTitle, noteBody, isNoteExpanded]);

    // Toggle note selection for bulk actions.
    const toggleNoteSelection = (id: string) => {
        setSelectedNoteIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
    };

    // Bulk-trash selected notes.
    const handleConfirmBulkTrash = async () => {
        if (isBulkDeleting || selectedNoteIds.length === 0) return;

        setIsBulkDeleting(true);
        setBulkDeleteError('');

        try {
            await bulkTrashNotes(selectedNoteIds);
            setSelectedNoteIds([]);
            setShowBulkTrashConfirm(false);
        } catch (error) {
            console.error('Failed to move selected notes to Trash:', error);
            setBulkDeleteError('Could not move selected notes to Trash. Please try again.');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const formatLocalDate = (dateString?: string) => {
        if (!dateString) return '';

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) return '';

        return (
            date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }) +
            ' at ' +
            date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            })
        );
    };

    if (loading && !notebook) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 relative">
            {/* NOTEBOOK HEADER */}
            <div className="flex items-center gap-3 px-2">
                <Link
                    href="/dashboard/notebooks"
                    className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 break-all">
                        {notebook?.title || 'Notebook'}
                    </h1>

                    {notebook?.description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {notebook.description}
                        </p>
                    )}
                </div>
            </div>

            {/* NOTE COMPOSER */}
            <div className="w-full max-w-2xl mx-auto">
                <div
                    className={`bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-md transition-all duration-200 ${isNoteExpanded
                        ? 'p-4'
                        : 'px-4 py-3 flex items-center justify-between cursor-pointer hover:shadow-lg'
                        }`}
                    onClick={() => {
                        if (!isNoteExpanded) setIsNoteExpanded(true);
                    }}
                >
                    {!isNoteExpanded ? (
                        <div className="text-zinc-500 dark:text-zinc-400 text-sm font-medium select-none w-full">
                            Take a note...
                        </div>
                    ) : (
                        <div className="space-y-3 w-full">
                            <input
                                type="text"
                                placeholder="Title"
                                value={noteTitle}
                                onChange={(event) =>
                                    setNoteTitle(event.target.value)
                                }
                                className="w-full bg-transparent border-none outline-none font-semibold text-zinc-800 dark:text-zinc-100 text-base"
                                autoFocus
                            />

                            <textarea
                                placeholder="Write here..."
                                value={noteBody}
                                onChange={(event) =>
                                    setNoteBody(event.target.value)
                                }
                                rows={2}
                                className="w-full bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-300 resize-none max-h-50 overflow-y-[field-sizing:content] [field-sizing:content]"
                            />

                            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400" />

                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void handleSaveNote();
                                        }}
                                        disabled={isSaving}
                                        className="px-4 mx-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckSquare className="w-4 h-4" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();

                                            if (autoSaveTimerRef.current) {
                                                clearTimeout(
                                                    autoSaveTimerRef.current,
                                                );
                                                autoSaveTimerRef.current = null;
                                            }

                                            setIsNoteExpanded(false);
                                        }}
                                        disabled={isSaving}
                                        className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* HEADING TITLE */}
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {notebook?.title
                        ? `${notebook.title} Notes (Drag to reorder)`
                        : 'Notebook Notes (Drag to reorder)'}
                </h2>
            </div>

            {/* NOTE SELECTION TOOLBAR - notes/page.tsx EXACT MATCH */}
            {(notes.length > 0 || selectedNoteIds.length > 0) && (
                <div className="flex flex-wrap items-center gap-3 px-2">
                    <button
                        type="button"
                        onClick={() =>
                            setSelectedNoteIds(
                                selectedNoteIds.length === notes.length
                                    ? []
                                    : notes.map((note) => note.id)
                            )
                        }
                        title={
                            selectedNoteIds.length === notes.length && notes.length > 0
                                ? 'Clear all selected notes'
                                : 'Select all visible notes'
                        }
                        className="inline-flex items-center gap-1.5 text-sm cursor-pointer text-zinc-600 dark:text-zinc-300 hover:text-amber-600 transition-colors"
                    >
                        {selectedNoteIds.length === notes.length && notes.length > 0 ? (
                            <>
                                <SquareX className="w-4 h-4 text-amber-600" />
                                <span>Deselect all</span>
                            </>
                        ) : (
                            <>
                                <CheckSquare className="w-4 h-4" />
                                <span>Select all</span>
                            </>
                        )}
                    </button>

                    {selectedNoteIds.length > 0 && (
                        <>
                            <span className="text-sm text-zinc-500">{selectedNoteIds.length} selected</span>
                            <button
                                type="button"
                                title="Move to Trash"
                                onClick={() => setShowBulkTrashConfirm(true)}
                                disabled={isBulkDeleting}
                                className="inline-flex items-center cursor-pointer gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* NOTES GRID */}
            {notes.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 space-y-3">
                    <SearchX className="w-12 h-12 stroke-[1.5]" />

                    <p className="text-base font-medium">No notes yet</p>

                    <p className="text-xs text-zinc-400">
                        Create a note to get started.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {notes.map((note, index) => {
                            const rawColor = note.color?.toLowerCase()?.trim();

                            const isDefaultColor =
                                !rawColor ||
                                rawColor === '#ffffff' ||
                                rawColor === '#fff' ||
                                rawColor === 'white' ||
                                rawColor === 'transparent';

                            return (
                                <div
                                    key={note.id}
                                    draggable={selectedNoteIds.length === 0}
                                    onDragStart={() => {
                                        if (selectedNoteIds.length === 0) {
                                            handleDragStart(index);
                                        }
                                    }}
                                    onDragOver={(event) => {
                                        if (selectedNoteIds.length === 0) {
                                            handleDragOver(event, index);
                                        }
                                    }}
                                    onDragEnd={() => {
                                        if (selectedNoteIds.length === 0) {
                                            handleDragEnd();
                                        }
                                    }}
                                    onClick={() => {
                                        if (selectedNoteIds.length > 0) {
                                            toggleNoteSelection(note.id);
                                            return;
                                        }
                                        handleStartEdit(note);
                                    }}
                                    style={{
                                        backgroundColor: isDefaultColor
                                            ? undefined
                                            : note.color,
                                    }}
                                    className={`group relative rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border cursor-pointer ${selectedNoteIds.includes(note.id) ? 'ring-2 ring-amber-500' : ''} ${isDefaultColor
                                        ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                        : 'border-black/10 dark:border-white/20 text-zinc-900 dark:text-zinc-100'
                                        }`}
                                >
                                    {/* Action controls - notes/page.tsx EXACT MATCH */}
                                    <div className="absolute top-3 right-3 flex items-center gap-1">
                                        <button
                                            type="button"
                                            aria-label={selectedNoteIds.includes(note.id) ? 'Deselect note' : 'Select note'}
                                            title={selectedNoteIds.includes(note.id) ? 'Deselect note' : 'Select note'}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                toggleNoteSelection(note.id);
                                            }}
                                            className={`rounded-full cursor-pointer bg-white/90 dark:bg-zinc-900/90 p-1 shadow-sm ${selectedNoteIds.includes(note.id) ? 'opacity-100 text-amber-600' : 'opacity-0 group-hover:opacity-100 text-zinc-500'}`}
                                        >
                                            {selectedNoteIds.includes(note.id)
                                                ? <Check className="h-4 w-4" />
                                                : <Square className="h-4 w-4" />}
                                        </button>

                                        <span className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-zinc-400 p-1">
                                            <GripVertical className="w-4 h-4" />
                                        </span>

                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleTogglePin(
                                                    note.id,
                                                    note.isPinned,
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
                                            const created = new Date(
                                                note.createdAt,
                                            ).getTime();

                                            const updated = new Date(
                                                note.updatedAt,
                                            ).getTime();

                                            const isUpdated =
                                                Math.abs(updated - created) >
                                                2000;

                                            return (
                                                <span className="text-[11px] text-zinc-400">
                                                    {isUpdated
                                                        ? 'Edited: '
                                                        : 'Created: '}
                                                    {formatLocalDate(
                                                        note.updatedAt ||
                                                        note.createdAt,
                                                    )}
                                                </span>
                                            );
                                        })()}

                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setNoteToDelete(note.id);
                                            }}
                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 rounded-full transition-colors cursor-pointer"
                                            title="Delete note"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Infinite scroll */}
                    {hasMore && (
                        <div
                            ref={loadMoreRef}
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

            {/* EDIT MODAL - notes/page.tsx EXACT MATCH */}
            {editingNoteId &&
                (() => {
                    const activeNote = notes.find(
                        (note) => note.id === editingNoteId,
                    );

                    if (!activeNote) return null;

                    const rawColor = activeNote.color
                        ?.toLowerCase()
                        ?.trim();

                    const isDefaultColor =
                        !rawColor ||
                        rawColor === '#ffffff' ||
                        rawColor === '#fff' ||
                        rawColor === 'white' ||
                        rawColor === 'transparent';

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                            <div
                                style={{
                                    backgroundColor: isDefaultColor
                                        ? undefined
                                        : activeNote.color,
                                }}
                                className={`relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 border ${isDefaultColor
                                    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                                    : 'border-black/10 dark:border-white/20 text-zinc-900 dark:text-zinc-100'
                                    }`}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="absolute top-4 right-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleTogglePin(
                                                activeNote.id,
                                                activeNote.isPinned,
                                            )
                                        }
                                        className={`p-1.5 rounded-full transition-colors cursor-pointer ${activeNote.isPinned
                                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                                            : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                            }`}
                                        title={
                                            activeNote.isPinned
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
                                    onChange={(event) =>
                                        setEditTitle(event.target.value)
                                    }
                                    className="w-full pr-10 bg-transparent border-none outline-none font-semibold text-zinc-800 dark:text-zinc-100 text-lg"
                                    autoFocus
                                    required
                                />

                                <textarea
                                    placeholder="Take a note..."
                                    value={editBody}
                                    onChange={(event) =>
                                        setEditBody(event.target.value)
                                    }
                                    rows={6}
                                    className="w-full bg-transparent border-none outline-none text-base text-zinc-700 dark:text-zinc-300 resize-none max-h-96 overflow-y-[field-sizing:content] [field-sizing:content]"
                                    required
                                />

                                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                        {(() => {
                                            const created = new Date(
                                                activeNote.createdAt,
                                            ).getTime();

                                            const updated = new Date(
                                                activeNote.updatedAt,
                                            ).getTime();

                                            const isUpdated =
                                                Math.abs(updated - created) >
                                                2000;

                                            return (
                                                <span className="text-[11px] text-zinc-400">
                                                    {isUpdated
                                                        ? 'Edited: '
                                                        : 'Created: '}
                                                    {formatLocalDate(
                                                        activeNote.updatedAt ||
                                                        activeNote.createdAt,
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
                                            onClick={handleSaveEdit}
                                            disabled={isUpdating}
                                            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <CheckSquare className="w-4 h-4" />
                                        </button>

                                        <button
                                            type="button"
                                            title="Cancel"
                                            onClick={handleCloseModal}
                                            disabled={isUpdating}
                                            className="px-4 py-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

            {/* BULK DELETE CONFIRMATION - notes/page.tsx EXACT MATCH */}
            {showBulkTrashConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
                    <div className="w-80 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Move selected notes to Trash?</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedNoteIds.length} selected note(s) will be moved to Trash. You can restore them later.</p>
                        {bulkDeleteError && <p role="alert" className="text-sm text-red-600">{bulkDeleteError}</p>}
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" disabled={isBulkDeleting} onClick={() => { setShowBulkTrashConfirm(false); setBulkDeleteError(''); }} className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer">Cancel</button>
                            <button type="button" disabled={isBulkDeleting} onClick={handleConfirmBulkTrash} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer">{isBulkDeleting ? 'Moving...' : 'Move to Trash'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SINGLE NOTE DELETE CONFIRMATION */}
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
                                type="button"
                                onClick={() => setNoteToDelete(null)}
                                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmDelete}
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