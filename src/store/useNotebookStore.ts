import { create } from 'zustand';
import type { Notebook } from '@/services/notebook.service';

interface NotebookStore {
    notebooks: Notebook[];
    trashNotebooks: Notebook[];

    hasLoaded: boolean;
    hasTrashLoaded: boolean;

    nextCursor: string | null;
    hasMore: boolean;

    setNotebooks: (
        notebooks:
            | Notebook[]
            | ((
                previousNotebooks: Notebook[],
            ) => Notebook[])
    ) => void;

    setTrashNotebooks: (
        notebooks:
            | Notebook[]
            | ((
                previousNotebooks: Notebook[],
            ) => Notebook[])
    ) => void;

    setPagination: (
        nextCursor: string | null,
        hasMore: boolean,
    ) => void;

    resetPagination: () => void;

    clearNotebooks: () => void;
}

export const useNotebookStore =
    create<NotebookStore>((set) => ({
        notebooks: [],
        trashNotebooks: [],

        hasLoaded: false,
        hasTrashLoaded: false,

        nextCursor: null,
        hasMore: true,

        setNotebooks: (notebooks) =>
            set((state) => ({
                notebooks:
                    typeof notebooks === 'function'
                        ? notebooks(state.notebooks)
                        : notebooks,

                hasLoaded: true,
            })),

        setTrashNotebooks: (notebooks) =>
            set((state) => ({
                trashNotebooks:
                    typeof notebooks === 'function'
                        ? notebooks(
                            state.trashNotebooks,
                        )
                        : notebooks,

                hasTrashLoaded: true,
            })),

        setPagination: (
            nextCursor,
            hasMore,
        ) =>
            set({
                nextCursor,
                hasMore,
            }),

        resetPagination: () =>
            set({
                nextCursor: null,
                hasMore: true,
            }),

        clearNotebooks: () =>
            set({
                notebooks: [],
                trashNotebooks: [],

                hasLoaded: false,
                hasTrashLoaded: false,

                nextCursor: null,
                hasMore: true,
            }),
    }));