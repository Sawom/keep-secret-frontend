import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // ক্রস-ডোমেইন রিকোয়েস্টে কুকি পাঠানোর জন্য এটি অত্যন্ত জরুরি
    headers: {
        'Content-Type': 'application/json',
    },
});

// নোট: HttpOnly কুকি ব্যবহারের কারণে রিকোয়েস্ট ইন্টারসেপ্টর থেকে localStorage-এর টোকেন হেডারে বসানোর কোডটি আর দরকার নেই।

// Response Interceptor: ব্যাকএন্ডের এররগুলো সুন্দরভাবে rap করে ফ্রন্টএন্ডে পাঠানো
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