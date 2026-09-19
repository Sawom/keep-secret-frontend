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
    notebookId?: string;
}

interface NotesStore {
    notes: Note[];
    trashNotes: Note[];

    hasLoaded: boolean;
    hasTrashLoaded: boolean;

    nextCursor: string | null;
    hasMore: boolean;

    setNotes: (
        notes:
            | Note[]
            | ((
                previousNotes: Note[]
            ) => Note[])
    ) => void;

    setPagination: (
        nextCursor: string | null,
        hasMore: boolean
    ) => void;

    resetPagination: () => void;

    setTrashNotes: (
        notes:
            | Note[]
            | ((
                previousNotes: Note[]
            ) => Note[])
    ) => void;

    clearNotes: () => void;
}

export const useNotesStore =
    create<NotesStore>((set) => ({
        notes: [],
        trashNotes: [],

        hasLoaded: false,
        hasTrashLoaded: false,

        nextCursor: null,
        hasMore: true,

        setNotes: (notes) =>
            set((state) => ({
                notes:
                    typeof notes ===
                        'function'
                        ? notes(
                            state.notes
                        )
                        : notes,

                hasLoaded: true,
            })),

        setPagination: (
            nextCursor,
            hasMore
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

        setTrashNotes: (notes) =>
            set((state) => ({
                trashNotes:
                    typeof notes ===
                        'function'
                        ? notes(
                            state.trashNotes
                        )
                        : notes,

                hasTrashLoaded: true,
            })),

        clearNotes: () =>
            set({
                notes: [],
                trashNotes: [],

                hasLoaded: false,
                hasTrashLoaded: false,

                nextCursor: null,
                hasMore: true,
            }),
    }));