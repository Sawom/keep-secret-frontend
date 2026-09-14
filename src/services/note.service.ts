import { api } from "./api";

export const noteService = {
    // ১. নতুন এনক্রিপ্টেড নোট তৈরি
    async createNote(data: {
        title: string;
        content: string;
        iv: string;
        authTag: string;
        color?: string;
        isPinned?: boolean;
        notebookId?: string;
    }) {
        // যেহেতু api.ts এ response.data রিটার্ন করা আছে, তাই সরাসরি রেসপন্স পাওয়া যাবে
        return await api.post('/notes', data);
    },

    // ২. সব সক্রিয় নোট ফেচ করা (নোটবুক আইডি থাকতেও পারে, নাও থাকতে পারে)
    async getNotes(notebookId?: string) {
        const url = notebookId ? `/notes?notebookId=${notebookId}` : '/notes';
        return await api.get(url);
    },

    // ৩. নির্দিষ্ট নোট আপডেট করা
    async updateNote(id: string, data: any) {
        return await api.patch(`/notes/${id}`, data);
    },

    // ৪. সফট ডিলিট (ট্র্যাশে পাঠানো)
    async softDeleteNote(id: string) {
        return await api.patch(`/notes/${id}/trash`);
    },

    // ৫. ট্র্যাশের নোটগুলোর লিস্ট ফেচ করা
    async getTrashNotes() {
        return await api.get('/notes/trash');
    },

    // ৬. ট্র্যাশ থেকে রিস্টোর করা
    async restoreNote(id: string) {
        return await api.patch(`/notes/${id}/restore`);
    },

    // ৭. পার্মানেন্ট ডিলিট করা
    async permanentDeleteNote(id: string) {
        return await api.delete(`/notes/${id}`);
    }
};