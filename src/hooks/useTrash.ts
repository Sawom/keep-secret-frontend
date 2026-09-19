import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import { trashService } from '../services/trash.service';
import { useTrashStore } from '../store/useTrashStore';

export function useTrash() {
    const notes = useTrashStore(
        (state) => state.notes
    );

    const notebooks = useTrashStore(
        (state) => state.notebooks
    );

    const hasLoaded = useTrashStore(
        (state) => state.hasLoaded
    );

    const setTrash = useTrashStore(
        (state) => state.setTrash
    );

    const removeNote = useTrashStore(
        (state) => state.removeNote
    );

    const removeNotebook = useTrashStore(
        (state) => state.removeNotebook
    );

    const clearTrash = useTrashStore(
        (state) => state.clearTrash
    );

    const [loading, setLoading] = useState(
        !hasLoaded
    );

    const [error, setError] = useState<string | null>(
        null
    );

    /**
     * Trash data fetch করবে।
     *
     * Cache থাকলে আগে cached data UI-তে থাকবে।
     * API background-এ refresh হবে।
     */
    const fetchTrash = useCallback(async () => {
        try {
            const currentHasLoaded =
                useTrashStore.getState().hasLoaded;

            if (!currentHasLoaded) {
                setLoading(true);
            }

            const data =
                await trashService.getTrash();

            setTrash(data);
            setError(null);
        } catch (err: any) {
            console.error(
                'Failed to fetch trash:',
                err
            );

            setError(
                err?.message ||
                'Failed to fetch trash'
            );
        } finally {
            setLoading(false);
        }
    }, [setTrash]);

    useEffect(() => {
        fetchTrash();
    }, [fetchTrash]);

    /**
     * Empty Trash
     *
     * Backend সফল হওয়ার পর local Trash cache
     * সঙ্গে সঙ্গে clear করা হবে।
     */
    const emptyTrash = useCallback(async () => {
        try {
            await trashService.emptyTrash();

            clearTrash();

            return true;
        } catch (err: any) {
            console.error(
                'Failed to empty trash:',
                err
            );

            setError(
                err?.message ||
                'Failed to empty trash'
            );

            return false;
        }
    }, [clearTrash]);

    /**
     * Individual note permanently delete হওয়ার পরে
     * Trash cache থেকে note remove করবে।
     */
    const handleRemoveNote = useCallback(
        (id: string) => {
            removeNote(id);
        },
        [removeNote]
    );

    /**
     * Individual notebook permanently delete হওয়ার পরে
     * Trash cache থেকে notebook remove করবে।
     */
    const handleRemoveNotebook = useCallback(
        (id: string) => {
            removeNotebook(id);
        },
        [removeNotebook]
    );

    return {
        notes,
        notebooks,
        loading,
        error,

        fetchTrash,
        emptyTrash,

        removeNote: handleRemoveNote,
        removeNotebook: handleRemoveNotebook,
    };
}