import { api } from './api';

export const authService = {
    // নতুন ইউজার রেজিস্টার করা
    async register(data: { name: string; email: string; password: string; confirmPassword: string }) {
        return await api.post('/auth/register', data);
    },

    // লগইন করা (HttpOnly কুকি ব্যাকএন্ড থেকে সেট হবে, তাই localStorage দরকার নেই)
    async login(data: { email: string; password: string }) {
        const response: any = await api.post('/auth/login', data);
        return response;
    },

    // পাসওয়ার্ড ভুলে গেলে রিকভারি রিকোয়েস্ট পাঠানো
    async forgotPassword(email: string) {
        return await api.post('/auth/forgot-password', { email });
    },

    // রিসেট পাসওয়ার্ড টোকেন দিয়ে নতুন পাসওয়ার্ড সেট করা
    async resetPassword(data: { token: string; newPassword: string }) {
        return await api.post('/auth/reset-password', data);
    },

    // প্রোফাইল ডেটা ফেচ করা (Protected Route)
    async getProfile() {
        return await api.get('/auth/profile');
    },
};