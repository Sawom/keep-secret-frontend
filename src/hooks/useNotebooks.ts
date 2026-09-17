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
    // 🔧 CHANGED: Active notebooks এখন Zustand cache থেকে আসবে।
    // Route change হলেও data destroy হবে না।
    const notebooks = useNotebookStore(
        (state) => state.notebooks
    );

    const setNotebooks = useNotebookStore(
        (state) => state.setNotebooks
    );

    const hasLoaded = useNotebookStore(
        (state) => state.hasLoaded
    );

    // 🔧 CHANGED: Cache থাকলে প্রথম render থেকেই loading false।
    const [loading, setLoading] =
        useState<boolean>(!hasLoaded);

    const [error, setError] =
        useState<string | null>(null);

    // 🔧 CHANGED: Trash data-ও Zustand cache থেকে নেওয়া হচ্ছে।
    const trashNotebooks =
        useNotebookStore(
            (state) => state.trashNotebooks
        );

    const setTrashNotebooks =
        useNotebookStore(
            (state) => state.setTrashNotebooks
        );

    const hasTrashLoaded =
        useNotebookStore(
            (state) => state.hasTrashLoaded
        );

    // ড্র্যাগ এন্ড ড্রপের জন্য স্টেট
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

    // 🔧 CHANGED: Zustand data পরিবর্তন হলে drag/drop ref sync থাকবে।
    useEffect(() => {
        notebooksRef.current = notebooks;
    }, [notebooks]);

    // 🔧 CHANGED: Active notebooks fetch এখন cache-aware।
    // Cache থাকলে blocking spinner হবে না।
    // API silently background-এ refresh করবে।
    const fetchNotebooks = useCallback(
        async (isInitial = false) => {
            try {
                const currentHasLoaded =
                    useNotebookStore.getState()
                        .hasLoaded;

                /*
                 * প্রথমবার data না থাকলে loading spinner দেখানো হবে।
                 *
                 * Route change করে আবার এলে Zustand cache
                 * থাকায় existing notebooks সঙ্গে সঙ্গে
                 * দেখানো হবে এবং API background-এ refresh হবে।
                 */
                if (!currentHasLoaded) {
                    setLoading(true);
                }

                const data =
                    await notebookService.getNotebooks();

                notebooksRef.current = data;

                // 🔧 CHANGED: Zustand cache update।
                setNotebooks(data);

                setError(null);
            } catch (err: any) {
                console.error(
                    'Failed to fetch notebooks:',
                    err
                );

                /*
                 * Background refresh fail করলে cached
                 * notebooks clear করা হবে না।
                 */
                setError(
                    err.message ||
                    'Failed to fetch notebooks'
                );
            } finally {
                setLoading(false);
            }
        },
        [setNotebooks]
    );

    // 🔧 CHANGED: Initial fetch এখন cache-aware।
    useEffect(() => {
        fetchNotebooks();
    }, [fetchNotebooks]);

    // ২. আইডি দিয়ে নির্দিষ্ট একটি নোটবুক ফেচ করা
    const getNotebookById = async (
        id: string
    ): Promise<Notebook | null> => {
        try {
            return await notebookService.getNotebookById(
                id
            );
        } catch (err: any) {
            setError(
                err.message ||
                'Failed to fetch notebook'
            );

            return null;
        }
    };

    // ৩. নতুন নোটবুক তৈরি
    // 🔧 CHANGED: New notebook Zustand cache-এ immediately add হবে।
    const createNotebook = async (
        dto: CreateNotebookDto
    ) => {
        try {
            const newNotebook =
                await notebookService.createNotebook(
                    dto
                );

            setNotebooks((prev) => [
                newNotebook,
                ...prev,
            ]);

            return newNotebook;
        } catch (err: any) {
            throw new Error(
                err.message ||
                'Failed to create notebook'
            );
        }
    };

    // ৪. নোটবুক আপডেট
    // 🔧 CHANGED: Updated notebook Zustand cache-এ immediately update হবে।
    const updateNotebook = async (
        id: string,
        dto: UpdateNotebookDto
    ) => {
        try {
            const updated =
                await notebookService.updateNotebook(
                    id,
                    dto
                );

            setNotebooks((prev) =>
                prev.map((nb) =>
                    nb.id === id
                        ? updated
                        : nb
                )
            );

            return updated;
        } catch (err: any) {
            throw new Error(
                err.message ||
                'Failed to update notebook'
            );
        }
    };

    // ৫. সফট ডিলিট (ট্র্যাশে পাঠানো)
    // 🔧 CHANGED: Active notebook Zustand cache থেকে remove হবে।
    const softDeleteNotebook = async (
        id: string
    ) => {
        try {
            await notebookService.softDeleteNotebook(
                id
            );

            setNotebooks((prev) =>
                prev.filter(
                    (nb) => nb.id !== id
                )
            );
        } catch (err: any) {
            throw new Error(
                err.message ||
                'Failed to move notebook to trash'
            );
        }
    };

    // 🔧 CHANGED: Trash fetch এখন আলাদা cache-aware loading ব্যবহার করে।
    // Active notebook cache থাকলে তার loading state-এ কোনো প্রভাব পড়বে না।
    const fetchTrashNotebooks =
        async () => {
            try {
                const currentHasTrashLoaded =
                    useNotebookStore.getState()
                        .hasTrashLoaded;

                /*
                 * প্রথমবার trash load হলে loading দেখাবে।
                 *
                 * ভবিষ্যতে একই route-এ ফিরে এলে cached
                 * trash data সঙ্গে সঙ্গে দেখানো যাবে।
                 */
                if (!currentHasTrashLoaded) {
                    setLoading(true);
                }

                const data =
                    await notebookService.getTrashNotebooks();

                // 🔧 CHANGED: Trash Zustand cache update।
                setTrashNotebooks(data);

                setError(null);
            } catch (err: any) {
                setError(
                    err.message ||
                    'Failed to fetch trash notebooks'
                );
            } finally {
                setLoading(false);
            }
        };

    // ৭. ট্র্যাশ থেকে নোটবুক রিস্টোর করা
    // 🔧 CHANGED: Restore-এর পর Zustand trash cache থেকে notebook remove হবে।
    const restoreNotebook = async (
        id: string
    ) => {
        try {
            await notebookService.restoreNotebook(
                id
            );

            setTrashNotebooks((prev) =>
                prev.filter(
                    (nb) => nb.id !== id
                )
            );
        } catch (err: any) {
            throw new Error(
                err.message ||
                'Failed to restore notebook'
            );
        }
    };

    // ৮. পার্মানেন্ট ডিলিট করা (সিঙ্গেল নোটবুক)
    // 🔧 CHANGED: Permanent delete-এর পর Zustand trash cache update হবে।
    const permanentDeleteNotebook =
        async (id: string) => {
            try {
                await notebookService.permanentDeleteNotebook(
                    id
                );

                setTrashNotebooks((prev) =>
                    prev.filter(
                        (nb) => nb.id !== id
                    )
                );
            } catch (err: any) {
                throw new Error(
                    err.message ||
                    'Failed to permanently delete notebook'
                );
            }
        };

    // ৯. ট্র্যাশ সম্পূর্ণ খালি করা (Empty Trash)
    // 🔧 CHANGED: Empty trash হলে Zustand trash cache empty হবে।
    const emptyTrash = async () => {
        try {
            await notebookService.emptyTrash();

            setTrashNotebooks([]);
        } catch (err: any) {
            throw new Error(
                err.message ||
                'Failed to empty notebook trash'
            );
        }
    };

    // drag and drop functions

    // 🔧 CHANGED: Drag start এখন Zustand-এর cached notebooks ব্যবহার করবে।
    const handleNotebookDragStart = (
        index: number
    ) => {
        originalNotebooksRef.current = [
            ...notebooks,
        ];

        notebooksRef.current = [
            ...notebooks,
        ];

        draggedNotebookIndexRef.current =
            index;

        setDraggedNotebookIndex(index);
    };

    // 🔧 CHANGED: Drag over-এর instant update Zustand cache-এ হবে।
    const handleNotebookDragOver = (
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
            updatedNotebooks[currentIndex];

        if (!draggedNotebook) {
            return;
        }

        // Old position থেকে remove
        updatedNotebooks.splice(
            currentIndex,
            1
        );

        // New position-এ insert
        updatedNotebooks.splice(
            index,
            0,
            draggedNotebook
        );

        // Immediately ref update
        notebooksRef.current =
            updatedNotebooks;

        // Immediately UI update
        setNotebooks(updatedNotebooks);

        // New dragged index remember
        draggedNotebookIndexRef.current =
            index;

        setDraggedNotebookIndex(index);
    };

    // 🔧 CHANGED: Reorder backend fail করলে Zustand cache-এ original order restore হবে।
    const handleNotebookDragEnd =
        async () => {
            if (
                draggedNotebookIndexRef.current ===
                null
            ) {
                return;
            }

            draggedNotebookIndexRef.current =
                null;

            setDraggedNotebookIndex(null);

            const currentNotebooks =
                notebooksRef.current;

            try {
                const reorderItems =
                    currentNotebooks.map(
                        (
                            notebook,
                            index
                        ) => ({
                            id: notebook.id,
                            position: index,
                        })
                    );

                await notebookService.reorderNotebooks(
                    reorderItems
                );
            } catch (error) {
                console.error(
                    'Failed to save notebook order:',
                    error
                );

                // Backend save fail করলে আগের order restore
                const originalNotebooks =
                    originalNotebooksRef.current;

                notebooksRef.current =
                    originalNotebooks;

                setNotebooks(
                    originalNotebooks
                );
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
        error,
        fetchNotebooks,
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