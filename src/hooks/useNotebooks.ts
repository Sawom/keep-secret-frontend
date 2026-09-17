import { useState, useEffect, useCallback, useRef } from 'react';
import { notebookService, Notebook, CreateNotebookDto, UpdateNotebookDto } from '@/services/notebook.service';

export function useNotebooks() {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [trashNotebooks, setTrashNotebooks] = useState<Notebook[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // ড্র্যাগ এন্ড ড্রপের জন্য স্টেট
    const [draggedNotebookIndex, setDraggedNotebookIndex] = useState<number | null>(null);
    const draggedNotebookIndexRef = useRef<number | null>(null);
    const notebooksRef = useRef<Notebook[]>([]);
    const originalNotebooksRef = useRef<Notebook[]>([]);

    // ১. সব সক্রিয় নোটবুক ফেচ করা
    const fetchNotebooks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await notebookService.getNotebooks();
            setNotebooks(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch notebooks');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotebooks();
    }, [fetchNotebooks]);

    // ২. আইডি দিয়ে নির্দিষ্ট একটি নোটবুক ফেচ করা
    const getNotebookById = async (id: string): Promise<Notebook | null> => {
        try {
            return await notebookService.getNotebookById(id);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch notebook');
            return null;
        }
    };

    // ৩. নতুন নোটবুক তৈরি
    const createNotebook = async (dto: CreateNotebookDto) => {
        try {
            const newNotebook = await notebookService.createNotebook(dto);
            setNotebooks((prev) => [newNotebook, ...prev]);
            return newNotebook;
        } catch (err: any) {
            throw new Error(err.message || 'Failed to create notebook');
        }
    };

    // ৪. নোটবুক আপডেট
    const updateNotebook = async (id: string, dto: UpdateNotebookDto) => {
        try {
            const updated = await notebookService.updateNotebook(id, dto);
            setNotebooks((prev) => prev.map((nb) => (nb.id === id ? updated : nb)));
            return updated;
        } catch (err: any) {
            throw new Error(err.message || 'Failed to update notebook');
        }
    };

    // ৫. সফট ডিলিট (ট্র্যাশে পাঠানো)
    const softDeleteNotebook = async (id: string) => {
        try {
            await notebookService.softDeleteNotebook(id);
            setNotebooks((prev) => prev.filter((nb) => nb.id !== id));
        } catch (err: any) {
            throw new Error(err.message || 'Failed to move notebook to trash');
        }
    };

    // ৬. ট্র্যাশের নোটবুকগুলো ফেচ করা
    const fetchTrashNotebooks = async () => {
        try {
            setLoading(true);
            const data = await notebookService.getTrashNotebooks();
            setTrashNotebooks(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch trash notebooks');
        } finally {
            setLoading(false);
        }
    };

    // ৭. ট্র্যাশ থেকে নোটবুক রিস্টোর করা
    const restoreNotebook = async (id: string) => {
        try {
            await notebookService.restoreNotebook(id);
            setTrashNotebooks((prev) => prev.filter((nb) => nb.id !== id));
        } catch (err: any) {
            throw new Error(err.message || 'Failed to restore notebook');
        }
    };

    // ৮. পার্মানেন্ট ডিলিট করা (সিঙ্গেল নোটবুক)
    const permanentDeleteNotebook = async (id: string) => {
        try {
            await notebookService.permanentDeleteNotebook(id);
            setTrashNotebooks((prev) => prev.filter((nb) => nb.id !== id));
        } catch (err: any) {
            throw new Error(err.message || 'Failed to permanently delete notebook');
        }
    };

    // ৯. ট্র্যাশ সম্পূর্ণ খালি করা (Empty Trash)
    const emptyTrash = async () => {
        try {
            await notebookService.emptyTrash();
            setTrashNotebooks([]);
        } catch (err: any) {
            throw new Error(err.message || 'Failed to empty notebook trash');
        }
    };

    //  drag and drop functions
    const handleNotebookDragStart = (index: number) => {
        originalNotebooksRef.current = [...notebooks];

        notebooksRef.current = [...notebooks];

        draggedNotebookIndexRef.current = index;

        setDraggedNotebookIndex(index);
    };

    const handleNotebookDragOver = (
        e: React.DragEvent,
        index: number,
    ) => {
        e.preventDefault();

        const currentIndex = draggedNotebookIndexRef.current;

        if (currentIndex === null || currentIndex === index) {
            return;
        }

        const updatedNotebooks = [...notebooksRef.current];

        const draggedNotebook = updatedNotebooks[currentIndex];

        if (!draggedNotebook) {
            return;
        }

        // Old position থেকে remove
        updatedNotebooks.splice(currentIndex, 1);

        // New position-এ insert
        updatedNotebooks.splice(index, 0, draggedNotebook);

        // Immediately ref update
        notebooksRef.current = updatedNotebooks;

        // Immediately UI update
        setNotebooks(updatedNotebooks);

        // New dragged index remember
        draggedNotebookIndexRef.current = index;
        setDraggedNotebookIndex(index);
    };

    const handleNotebookDragEnd = async () => {
        if (draggedNotebookIndexRef.current === null) {
            return;
        }

        draggedNotebookIndexRef.current = null;
        setDraggedNotebookIndex(null);

        const currentNotebooks = notebooksRef.current;

        try {
            const reorderItems = currentNotebooks.map((notebook, index) => ({
                id: notebook.id,
                position: index,
            }));

            await notebookService.reorderNotebooks(reorderItems);
        } catch (error) {
            console.error('Failed to save notebook order:', error);

            // Backend save fail করলে আগের order restore
            const originalNotebooks = originalNotebooksRef.current;

            notebooksRef.current = originalNotebooks;
            setNotebooks(originalNotebooks);
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