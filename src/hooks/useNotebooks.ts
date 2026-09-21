import {
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';

import {
    notebookService,
    Notebook,
    CreateNotebookDto,
    UpdateNotebookDto,
} from '@/services/notebook.service';

import { useNotebookStore } from '@/store/useNotebookStore';

export function useNotebooks() {
    const notebooks = useNotebookStore(
        (state) => state.notebooks,
    );

    const setNotebooks = useNotebookStore(
        (state) => state.setNotebooks,
    );

    const hasLoaded = useNotebookStore(
        (state) => state.hasLoaded,
    );

    const nextCursor = useNotebookStore(
        (state) => state.nextCursor,
    );

    const hasMore = useNotebookStore(
        (state) => state.hasMore,
    );

    const setPagination =
        useNotebookStore(
            (state) => state.setPagination,
        );

    const resetPagination =
        useNotebookStore(
            (state) => state.resetPagination,
        );

    const [loading, setLoading] =
        useState<boolean>(!hasLoaded);

    const [loadingMore, setLoadingMore] =
        useState<boolean>(false);

    const [error, setError] =
        useState<string | null>(null);

    /**
     * Trash
     */
    const trashNotebooks =
        useNotebookStore(
            (state) => state.trashNotebooks,
        );

    const setTrashNotebooks =
        useNotebookStore(
            (state) => state.setTrashNotebooks,
        );

    const hasTrashLoaded =
        useNotebookStore(
            (state) => state.hasTrashLoaded,
        );

    /**
     * Drag/drop
     */
    const [
        draggedNotebookIndex,
        setDraggedNotebookIndex,
    ] = useState<number | null>(null);

    const draggedNotebookIndexRef =
        useRef<number | null>(null);

    const notebooksRef =
        useRef<Notebook[]>([]);

    const originalNotebooksRef =
        useRef<Notebook[]>([]);

    const isLoadingMoreRef =
        useRef(false);

    /**
     * Always keep ref synced with current Zustand list.
     */
    useEffect(() => {
        notebooksRef.current = notebooks;
    }, [notebooks]);

    /**
     * Initial/background fetch
     *
     * Existing cache থাকলে spinner দেখাবে না।
     */
    const fetchNotebooks = useCallback(
        async (
            showInitialLoading = false,
        ) => {
            try {
                if (showInitialLoading) {
                    setLoading(true);
                }

                const response =
                    await notebookService.getNotebooks(
                        20,
                    );

                const pageData =
                    response.data ?? [];

                notebooksRef.current =
                    pageData;

                setNotebooks(pageData);

                setPagination(
                    response.nextCursor ??
                    null,
                    response.hasMore ??
                    false,
                );

                setError(null);
            } catch (err: any) {
                console.error(
                    'Failed to fetch notebooks:',
                    err,
                );

                setError(
                    err?.message ||
                    'Failed to fetch notebooks',
                );
            } finally {
                setLoading(false);
            }
        },
        [
            setNotebooks,
            setPagination,
        ],
    );

    /**
     * Initial load.
     *
     * Cache থাকলে background refresh হবে,
     * কিন্তু spinner হবে না।
     */
    useEffect(() => {
        fetchNotebooks(!hasLoaded);
    }, [
        fetchNotebooks,
        hasLoaded,
    ]);

    /**
     * Load next 20 notebooks.
     */
    const loadMoreNotebooks =
        useCallback(async () => {
            const store =
                useNotebookStore.getState();

            if (
                isLoadingMoreRef.current ||
                !store.hasMore ||
                !store.nextCursor
            ) {
                return;
            }

            try {
                isLoadingMoreRef.current =
                    true;

                setLoadingMore(true);

                const response =
                    await notebookService.getNotebooks(
                        20,
                        store.nextCursor,
                    );

                const newNotebooks =
                    response.data ?? [];

                setNotebooks(
                    (previous) => {
                        const existingIds =
                            new Set(
                                previous.map(
                                    (notebook) =>
                                        notebook.id,
                                ),
                            );

                        const uniqueNewNotebooks =
                            newNotebooks.filter(
                                (notebook) =>
                                    !existingIds.has(
                                        notebook.id,
                                    ),
                            );

                        const updated = [
                            ...previous,
                            ...uniqueNewNotebooks,
                        ];

                        notebooksRef.current =
                            updated;

                        return updated;
                    },
                );

                setPagination(
                    response.nextCursor ??
                    null,
                    response.hasMore ??
                    false,
                );
            } catch (err) {
                console.error(
                    'Failed to load more notebooks:',
                    err,
                );
            } finally {
                isLoadingMoreRef.current =
                    false;

                setLoadingMore(false);
            }
        }, [
            setNotebooks,
            setPagination,
        ]);

    /**
     * Single notebook
     */
    const getNotebookById =
        async (
            id: string,
        ): Promise<Notebook | null> => {
            try {
                return await notebookService
                    .getNotebookById(id);
            } catch (err: any) {
                setError(
                    err?.message ||
                    'Failed to fetch notebook',
                );

                return null;
            }
        };

    /**
     * Create notebook
     */
    const createNotebook =
        async (
            dto: CreateNotebookDto,
        ) => {
            try {
                const newNotebook =
                    await notebookService
                        .createNotebook(dto);

                setNotebooks(
                    (previous) => [
                        newNotebook,
                        ...previous,
                    ],
                );

                return newNotebook;
            } catch (err: any) {
                throw new Error(
                    err?.message ||
                    'Failed to create notebook',
                );
            }
        };

    /**
     * Update notebook
     */
    const updateNotebook =
        async (
            id: string,
            dto: UpdateNotebookDto,
        ) => {
            try {
                const updated =
                    await notebookService
                        .updateNotebook(
                            id,
                            dto,
                        );

                setNotebooks(
                    (previous) =>
                        previous.map(
                            (notebook) =>
                                notebook.id === id
                                    ? {
                                        ...notebook,
                                        ...updated,
                                    }
                                    : notebook,
                        ),
                );

                return updated;
            } catch (err: any) {
                throw new Error(
                    err?.message ||
                    'Failed to update notebook',
                );
            }
        };

    /**
     * Soft delete
     */
    const softDeleteNotebook =
        async (id: string) => {
            try {
                await notebookService
                    .softDeleteNotebook(id);

                setNotebooks(
                    (previous) =>
                        previous.filter(
                            (notebook) =>
                                notebook.id !== id,
                        ),
                );
            } catch (err: any) {
                throw new Error(
                    err?.message ||
                    'Failed to move notebook to trash',
                );
            }
        };

    /**
     * Trash fetch
     */
    const fetchTrashNotebooks =
        async () => {
            try {
                if (!hasTrashLoaded) {
                    setLoading(true);
                }

                const data =
                    await notebookService
                        .getTrashNotebooks();

                setTrashNotebooks(data);

                setError(null);
            } catch (err: any) {
                setError(
                    err?.message ||
                    'Failed to fetch trash notebooks',
                );
            } finally {
                setLoading(false);
            }
        };

    /**
     * Restore
     */
    const restoreNotebook =
        async (id: string) => {
            try {
                await notebookService
                    .restoreNotebook(id);

                setTrashNotebooks(
                    (previous) =>
                        previous.filter(
                            (notebook) =>
                                notebook.id !== id,
                        ),
                );
            } catch (err: any) {
                throw new Error(
                    err?.message ||
                    'Failed to restore notebook',
                );
            }
        };

    /**
     * Permanent delete
     */
    const permanentDeleteNotebook =
        async (id: string) => {
            try {
                await notebookService
                    .permanentDeleteNotebook(id);

                setTrashNotebooks(
                    (previous) =>
                        previous.filter(
                            (notebook) =>
                                notebook.id !== id,
                        ),
                );
            } catch (err: any) {
                throw new Error(
                    err?.message ||
                    'Failed to permanently delete notebook',
                );
            }
        };

    /**
     * Empty trash
     */
    const emptyTrash =
        async () => {
            try {
                await notebookService
                    .emptyTrash();

                setTrashNotebooks([]);
            } catch (err: any) {
                throw new Error(
                    err?.message ||
                    'Failed to empty notebook trash',
                );
            }
        };

    /**
        DRAG & DROP
     */

    const handleNotebookDragStart =
        (index: number) => {
            originalNotebooksRef.current =
                [...notebooks];

            notebooksRef.current =
                [...notebooks];

            draggedNotebookIndexRef.current =
                index;

            setDraggedNotebookIndex(index);
        };

    const handleNotebookDragOver =
        (
            e: React.DragEvent,
            index: number,
        ) => {
            e.preventDefault();

            const currentIndex =
                draggedNotebookIndexRef.current;

            if (
                currentIndex === null ||
                currentIndex === index
            ) {
                return;
            }

            const updatedNotebooks = [
                ...notebooksRef.current,
            ];

            const draggedNotebook =
                updatedNotebooks[
                currentIndex
                ];

            if (!draggedNotebook) {
                return;
            }

            updatedNotebooks.splice(
                currentIndex,
                1,
            );

            updatedNotebooks.splice(
                index,
                0,
                draggedNotebook,
            );

            notebooksRef.current =
                updatedNotebooks;

            setNotebooks(
                updatedNotebooks,
            );

            draggedNotebookIndexRef.current =
                index;

            setDraggedNotebookIndex(index);
        };

    const handleNotebookDragEnd =
        async () => {
            const draggedIndex =
                draggedNotebookIndexRef.current;

            if (draggedIndex === null) {
                return;
            }

            const currentNotebooks =
                notebooksRef.current;

            const draggedNotebook =
                currentNotebooks[
                draggedIndex
                ];

            if (!draggedNotebook) {
                draggedNotebookIndexRef.current =
                    null;

                setDraggedNotebookIndex(null);

                return;
            }

            /**
             * Neighbor determine.
             *
             * beforeId = item immediately before
             * afterId = item immediately after
             */
            const beforeNotebook =
                currentNotebooks[
                draggedIndex - 1
                ];

            const afterNotebook =
                currentNotebooks[
                draggedIndex + 1
                ];

            draggedNotebookIndexRef.current =
                null;

            setDraggedNotebookIndex(null);

            try {
                await notebookService
                    .reorderNotebooks(
                        draggedNotebook.id,
                        beforeNotebook?.id ??
                        null,
                        afterNotebook?.id ??
                        null,
                    );
            } catch (error) {
                console.error(
                    'Failed to save notebook order:',
                    error,
                );

                /**
                 * Backend fail হলে আগের order restore.
                 */
                const original =
                    originalNotebooksRef.current;

                notebooksRef.current =
                    original;

                setNotebooks(original);
            }
        };

    return {
        draggedNotebookIndex,

        handleNotebookDragStart,
        handleNotebookDragOver,
        handleNotebookDragEnd,

        notebooks,
        trashNotebooks,

        loading,
        loadingMore,
        error,

        hasMore,

        fetchNotebooks,
        loadMoreNotebooks,

        getNotebookById,

        createNotebook,
        updateNotebook,
        softDeleteNotebook,

        fetchTrashNotebooks,
        restoreNotebook,
        permanentDeleteNotebook,
        emptyTrash,
    };
}