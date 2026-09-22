import { Note } from "@/store/useNotesStore";
import { api } from "./api";

export const noteService = {
    // ১. নতুন নোট তৈরি
    async createNote(data: {
        title: string;
        content: string;
        color?: string;
        isPinned?: boolean;
        notebookId?: string;
    }) {
        return await api.post(
            '/notes',
            data
        );
    },

    // ২. Active notes cursor pagination সহ fetch
    // ২. Active notes cursor pagination সহ fetch
    async getNotes(
        notebookId?: string,
        limit = 20,
        cursor?: string,
    ) {
        const params =
            new URLSearchParams();

        params.set(
            'limit',
            String(limit)
        );

        if (notebookId) {
            params.set(
                'notebookId',
                notebookId
            );
        }

        if (cursor) {
            params.set(
                'cursor',
                cursor
            );
        }

        /*
         * api.ts interceptor runtime-এ
         * response.data return করে।
         *
         * কিন্তু Axios-এর default TypeScript typing
         * এখনো AxiosResponse ধরে নেয়।
         *
         * তাই এখানে actual returned shape explicitly
         * type করা হচ্ছে।
         */
        return await api.get<{
            data: Note[];
            nextCursor: string | null;
            hasMore: boolean;
        }>(
            `/notes?${params.toString()}`
        ) as unknown as {
            data: Note[];
            nextCursor: string | null;
            hasMore: boolean;
        };
    },

    // ৩. Search notes
    async searchNotes(
        query: string,
        limit = 50,
        signal?: AbortSignal,
    ) {
        const params =
            new URLSearchParams();

        params.set(
            'q',
            query.trim()
        );

        params.set(
            'limit',
            String(limit)
        );

        return await api.get<{
            data: Note[];
            hasMore: boolean;
        }>(
            `/notes/search?${params.toString()}`,
            {
                signal,
            },
        ) as unknown as {
            data: Note[];
            hasMore: boolean;
        };
    },

    // ৪. নির্দিষ্ট নোট fetch
    async getNoteById(id: string) {
        return await api.get(
            `/notes/${id}`
        );
    },

    // ৫. নোট update
    async updateNote(
        id: string,
        data: {
            title?: string;
            content?: string;
            color?: string;
            isPinned?: boolean;
            notebookId?: string;
        }
    ) {
        return await api.patch(
            `/notes/${id}`,
            data
        );
    },

    // ৬. নোট Trash-এ পাঠানো
    async softDeleteNote(id: string) {
        return await api.patch(
            `/notes/${id}/trash`
        );
    },

    // ৭. Trash notes fetch
    async getTrashNotes() {
        return await api.get(
            '/notes/trash'
        );
    },

    // ৮. Restore
    async restoreNote(id: string) {
        return await api.patch(
            `/notes/${id}/restore`
        );
    },

    // ৯. Permanent delete
    async permanentDeleteNote(
        id: string
    ) {
        return await api.delete(
            `/notes/${id}`
        );
    },

    // ১০. Empty trash
    async emptyTrash() {
        return await api.delete(
            '/notes/trash/empty'
        );
    },

    // ১১. Reorder notes
    async reorderNotes(
        items: {
            id: string;
            position: number;
        }[],
        notebookId?: string,
    ) {
        return await api.patch(
            '/notes/reorder',
            {
                items,
                ...(notebookId
                    ? {
                        notebookId,
                    }
                    : {}),
            }
        );
    }

};