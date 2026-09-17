import { useState, useEffect, useCallback } from 'react';
import { notebookService, Notebook, CreateNotebookDto, UpdateNotebookDto } from '@/services/notebook.service';

export function useNotebooks() {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [trashNotebooks, setTrashNotebooks] = useState<Notebook[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    return {
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