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

    // নোটবুক ডিলিট করা
    async deleteNotebook(id: string): Promise<{ message: string }> {
        return await api.delete(`/notebooks/${id}`);
    },
};