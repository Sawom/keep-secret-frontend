import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // কুকি (refresh token) পাঠানোর জন্য বাধ্যতামূলক
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: প্রতি রিকোয়েস্টের সাথে Zustand থেকে Access Token যুক্ত করে দেওয়া
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: 401 এরর আসলে সাইলেন্টলি রিফ্রেশ টোকেন দিয়ে এক্সেস টোকেন রিনিউ করা
api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // সাইলেন্টলি নতুন এক্সেস টোকেনের জন্য কল করা
                const res: any = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.accessToken;
                useAuthStore.getState().setAccessToken(newAccessToken);

                // পুরানো আটকে থাকা রিকোয়েস্ট নতুন টোকেন দিয়ে পুনরায় চালানো
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // রিফ্রেশ টোকেনও মেয়াদোত্তীর্ণ হলে স্টেট ক্লিয়ার করে লগইন পেজে পাঠানো
                useAuthStore.getState().logout();
                window.location.href = '/login?callbackUrl=/dashboard';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);