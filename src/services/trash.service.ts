import { api } from './api';

export interface TrashNote {
    id: string;
    title: string;
    content: string;
    color?: string;
    isPinned: boolean;
    position: number;
    isDeleted: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TrashNotebook {
    id: string;
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    position: number;
    isDeleted: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TrashResponse {
    notes: TrashNote[];
    notebooks: TrashNotebook[];
}

export const trashService = {
    /**
     * User-এর সব trashed notes এবং notebooks একসাথে fetch করবে।
     */
    async getTrash(): Promise<TrashResponse> {
        return await api.get('/trash');
    },

    /**
     * Notes + Notebooks দুই ধরনের trashed data permanently delete করবে।
     */
    async emptyTrash(): Promise<{
        message: string;
        notes: number;
        notebooks: number;
    }> {
        return await api.delete('/trash/empty');
    },
};