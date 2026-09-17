import { create } from 'zustand';

export interface Note {
    id: string;
    title: string;
    content: string;
    color?: string;
    isPinned: boolean;
    position: number;
    createdAt: string;
    updatedAt: string;
}

interface NotesStore {
    notes: Note[];
    trashNotes: Note[];

    hasLoaded: boolean;
    hasTrashLoaded: boolean;

    setNotes: (
        notes: Note[] | ((previousNotes: Note[]) => Note[])
    ) => void;

    setTrashNotes: (
        notes:
            | Note[]
            | ((previousNotes: Note[]) => Note[])
    ) => void;

    clearNotes: () => void;
}

export const useNotesStore = create<NotesStore>((set) => ({
    notes: [],
    trashNotes: [],

    hasLoaded: false,
    hasTrashLoaded: false,

    setNotes: (notes) =>
        set((state) => ({
            notes:
                typeof notes === 'function'
                    ? notes(state.notes)
                    : notes,

            hasLoaded: true,
        })),

    setTrashNotes: (notes) =>
        set((state) => ({
            trashNotes:
                typeof notes === 'function'
                    ? notes(state.trashNotes)
                    : notes,

            hasTrashLoaded: true,
        })),

    clearNotes: () =>
        set({
            notes: [],
            trashNotes: [],

            hasLoaded: false,
            hasTrashLoaded: false,
        }),
}));