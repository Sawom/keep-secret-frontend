import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ১. Request Interceptor: লোকালস্টোরেজ থেকে JWT টোকেন রিড করে হেডার-এ যুক্ত করা
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ২. Response Interceptor: ব্যাকএন্ডের এররগুলো সুন্দরভাবে rap করে ফ্রন্টএন্ডে পাঠানো
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const errorResponse = error.response?.data;
        const errorMessage = Array.isArray(errorResponse?.message)
            ? errorResponse.message[0]
            : errorResponse?.message || 'Something went wrong!';

        return Promise.reject({
            statusCode: error.response?.status || 500,
            message: errorMessage,
            error: errorResponse?.error || 'Error',
        });
    }
);