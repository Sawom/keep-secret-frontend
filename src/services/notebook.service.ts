import { api } from "./api";

export interface Notebook {
    id: string;
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    position: number;
    _count?: {
        notes: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateNotebookDto {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    position?: number;
}

export interface UpdateNotebookDto extends Partial<CreateNotebookDto> { }

export const notebookService = {
    // ইউজারের সব নোটবুক নিয়ে আসা
    async getNotebooks(): Promise<Notebook[]> {
        return await api.get('/notebooks');
    },

    // নির্দিষ্ট একটি নোটবুকের ডিটেইলস আনা
    async getNotebookById(id: string): Promise<Notebook> {
        return await api.get(`/notebooks/${id}`);
    },

    // নতুন নোটবুক তৈরি করা
    async createNotebook(dto: CreateNotebookDto): Promise<Notebook> {
        return await api.post('/notebooks', dto);
    },

    // নোটবুক আপডেট করা
    async updateNotebook(id: string, dto: UpdateNotebookDto): Promise<Notebook> {
        return await api.patch(`/notebooks/${id}`, dto);
    },

    // নোটবুক ট্র্যাশে পাঠানো (Soft Delete)
    async softDeleteNotebook(id: string): Promise<Notebook> {
        return await api.patch(`/notebooks/${id}/trash`);
    },

    // ট্র্যাশে থাকা সব নোটবুক নিয়ে আসা
    async getTrashNotebooks(): Promise<Notebook[]> {
        return await api.get('/notebooks/trash');
    },

    // ট্র্যাশ থেকে নোটবুক রিস্টোর করা
    async restoreNotebook(id: string): Promise<Notebook> {
        return await api.patch(`/notebooks/${id}/restore`);
    },

    // নোটবুকের ট্র্যাশ সম্পূর্ণ খালি করা -> রাউট হবে /notebooks/trash/empty
    async emptyTrash(): Promise<{ message: string; count: number }> {
        return await api.delete('/notebooks/trash/empty');
    },

    // নির্দিষ্ট নোটবুক স্থায়ীভাবে ডিলিট করা (Hard Delete)
    async permanentDeleteNotebook(id: string): Promise<{ message: string }> {
        return await api.delete(`/notebooks/${id}`);
    }

};