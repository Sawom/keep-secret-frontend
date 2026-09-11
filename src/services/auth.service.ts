import { api } from './api';

export const authService = {

    async register(data: {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) {
        return await api.post('/auth/register', data);
    },

    async login(data: {
        email: string;
        password: string;
    }) {
        return await api.post('/auth/login', data);
    },

    async forgotPassword(email: string) {
        return await api.post('/auth/forgot-password', {
            email,
        });
    },

    async resetPassword(data: {
        token: string;
        newPassword: string;
    }) {
        return await api.post('/auth/reset-password', data);
    },

    async getProfile() {
        return await api.get('/auth/profile');
    },
};