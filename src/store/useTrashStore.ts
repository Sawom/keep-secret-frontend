import { create } from 'zustand';

import type {
    TrashNote,
    TrashNotebook,
} from '@/services/trash.service';

interface TrashStore {
    notes: TrashNote[];
    notebooks: TrashNotebook[];

    hasLoaded: boolean;

    setTrash: (
        data:
            | {
                notes: TrashNote[];
                notebooks: TrashNotebook[];
            }
            | ((
                previous: {
                    notes: TrashNote[];
                    notebooks: TrashNotebook[];
                }
            ) => {
                notes: TrashNote[];
                notebooks: TrashNotebook[];
            })
    ) => void;

    removeNote: (id: string) => void;
    removeNotebook: (id: string) => void;

    clearTrash: () => void;
}

export const useTrashStore = create<TrashStore>((set) => ({
    notes: [],
    notebooks: [],

    hasLoaded: false,

    setTrash: (data) =>
        set((state) => {
            const previous = {
                notes: state.notes,
                notebooks: state.notebooks,
            };

            return {
                ...(typeof data === 'function'
                    ? data(previous)
                    : data),

                hasLoaded: true,
            };
        }),

    removeNote: (id) =>
        set((state) => ({
            notes: state.notes.filter(
                (note) => note.id !== id
            ),
        })),

    removeNotebook: (id) =>
        set((state) => ({
            notebooks: state.notebooks.filter(
                (notebook) => notebook.id !== id
            ),
        })),

    clearTrash: () =>
        set({
            notes: [],
            notebooks: [],
            hasLoaded: false,
        }),
}));