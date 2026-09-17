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
    hasLoaded: boolean;

    setNotes: (
        notes: Note[] | ((previousNotes: Note[]) => Note[])
    ) => void;

    clearNotes: () => void;
}

export const useNotesStore = create<NotesStore>((set) => ({
    notes: [],
    hasLoaded: false,

    setNotes: (notes) =>
        set((state) => ({
            notes:
                typeof notes === 'function'
                    ? notes(state.notes)
                    : notes,
            hasLoaded: true,
        })),

    clearNotes: () =>
        set({
            notes: [],
            hasLoaded: false,
        }),
}));