'use client';

import React, { useEffect, useState, use, useRef, useCallback, } from 'react';
import { useNotebooks } from '@/hooks/useNotebooks';
import { noteService } from '@/services/note.service';
import { Notebook } from '@/services/notebook.service';
import { ArrowLeft, Loader2, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

export default function SingleNotebookPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const notebookId = resolvedParams.id;

    const { getNotebookById } = useNotebooks();

    const [notebook, setNotebook] =
        useState<Notebook | null>(null);

    const [notes, setNotes] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState<boolean>(true);

    const [loadingMore, setLoadingMore] =
        useState<boolean>(false);

    const [nextCursor, setNextCursor] =
        useState<string | null>(null);

    const [hasMore, setHasMore] =
        useState<boolean>(false);

    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    /*
     * প্রথমবার Notebook এবং প্রথম 20টি Note load করা
     */
    useEffect(() => {
        const loadNotebookData = async () => {
            try {
                setLoading(true);

                // আইডি দিয়ে নির্দিষ্ট নোটবুকের তথ্য আনা
                const nbData =
                    await getNotebookById(notebookId);

                setNotebook(nbData);

                // এই Notebook-এর প্রথম 20টি Note আনা
                const notesResponse =
                    await noteService.getNotes(
                        notebookId,
                        20
                    );

                setNotes(
                    notesResponse?.data ?? []
                );

                setNextCursor(
                    notesResponse?.nextCursor ?? null
                );

                setHasMore(
                    notesResponse?.hasMore ?? false
                );
            } catch (error) {
                console.error(
                    'Failed to load notebook details:',
                    error
                );

                setNotes([]);
                setNextCursor(null);
                setHasMore(false);
            } finally {
                setLoading(false);
            }
        };

        loadNotebookData();
    }, [notebookId]);

    /*
     * পরের 20টি Note load করা
     */
    const loadMoreNotes = useCallback(
        async () => {
            if (
                loadingMore ||
                !hasMore ||
                !nextCursor
            ) {
                return;
            }

            try {
                setLoadingMore(true);

                const notesResponse =
                    await noteService.getNotes(
                        notebookId,
                        20,
                        nextCursor
                    );

                const newNotes =
                    notesResponse?.data ?? [];

                /*
                 * আগের Note-এর সাথে নতুন Note যোগ হবে
                 */
                setNotes((previousNotes) => [
                    ...previousNotes,
                    ...newNotes,
                ]);

                setNextCursor(
                    notesResponse?.nextCursor ?? null
                );

                setHasMore(
                    notesResponse?.hasMore ?? false
                );
            } catch (error) {
                console.error(
                    'Failed to load more notebook notes:',
                    error
                );
            } finally {
                setLoadingMore(false);
            }
        },
        [
            notebookId,
            loadingMore,
            hasMore,
            nextCursor,
        ]
    );

    /*
     * User নিচের দিকে গেলে automatically
     * পরের 20টি Note load হবে
     */
    useEffect(() => {
        const target =
            loadMoreRef.current;

        if (!target || !hasMore) {
            return;
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    const entry = entries[0];

                    if (
                        entry.isIntersecting
                    ) {
                        loadMoreNotes();
                    }
                },
                {
                    root: null,
                    rootMargin: '300px',
                    threshold: 0,
                }
            );

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [
        loadMoreNotes,
        hasMore,
    ]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">

            {/* ব্যাক বাটন এবং নোটবুক ইনফো */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/notebooks"
                        className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor:
                                        notebook?.color ||
                                        '#3B82F6',
                                }}
                            />

                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                {notebook?.title ||
                                    'Notebook'}
                            </h1>
                        </div>

                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {notebook?.description ||
                                'Explore notes inside this notebook.'}
                        </p>
                    </div>
                </div>

                <Link
                    href={`/dashboard/notes?notebookId=${notebookId}`}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Note Here
                </Link>
            </div>

            {/* নোটস লিস্ট অথবা এম্প্টি স্টেট */}
            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 space-y-3 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <FileText className="w-12 h-12 stroke-[1.5]" />

                    <p className="text-base font-medium">
                        No notes in this notebook yet
                    </p>

                    <p className="text-xs text-zinc-400">
                        Create a note and assign it to this notebook.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {notes.map((note) => (
                            <div
                                key={note.id}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2"
                            >
                                <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 text-base">
                                    {note.title}
                                </h3>

                                <p className="text-zinc-500 dark:text-zinc-400 text-xs line-clamp-3">
                                    {note.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Infinite scroll trigger */}
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

                    {!hasMore && (
                        <div className="flex justify-center py-8">
                            <p className="text-xs text-zinc-400">
                                No more notes
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}