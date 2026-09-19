import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
} from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface RetryableRequestConfig
    extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

/*
 * 🔧 CHANGED:
 *
 * Access token আর frontend থেকে manually read করা হবে না।
 *
 * Access token এবং refresh token দুটোই HttpOnly cookie।
 *
 * Browser automatically cookie পাঠাবে কারণ
 * withCredentials: true আছে।
 */
export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

/*
 * 🔧 CHANGED:
 *
 * Access token HttpOnly হওয়ায় এখানে আর
 * Authorization header manually সেট করা হবে না।
 *
 * Browser নিজে accessToken cookie পাঠাবে।
 */
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => Promise.reject(error)
);

/*
 * 🔧 CHANGED:
 *
 * একই সময়ে একাধিক API request 401 করলে
 * একাধিক refresh request না পাঠিয়ে
 * একটি refresh request-এর Promise সবাই share করবে।
 */
let refreshPromise: Promise<void> | null = null;

const refreshAccessToken = async (): Promise<void> => {
    if (!refreshPromise) {
        refreshPromise = axios
            .post(
                `${API_BASE_URL}/auth/refresh`,
                {},
                {
                    withCredentials: true,
                }
            )
            .then((response) => {
                /*
                 * Backend এখন access token HttpOnly cookie-তে
                 * set করবে।
                 *
                 * তাই frontend-এ token save করার দরকার নেই।
                 */
                return;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

/*
 * 🔧 CHANGED:
 *
 * 401 হলে silently access token refresh করবে।
 *
 * Refresh successful হলে original request আবার চালাবে।
 *
 * Refresh endpoint নিজে 401 দিলে infinite loop হবে না,
 * কারণ refresh request raw axios দিয়ে করা হচ্ছে api দিয়ে নয়।
 */
api.interceptors.response.use(
    (response) => response.data,

    async (error: AxiosError) => {
        const originalRequest =
            error.config as RetryableRequestConfig | undefined;

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }

        /*
         * Original request-কে একবারের বেশি retry করা যাবে না।
         */
        originalRequest._retry = true;

        try {
            /*
             * Access token expired হলে refresh cookie ব্যবহার করে
             * নতুন access token cookie সেট করা হবে।
             */
            await refreshAccessToken();

            /*
             * নতুন accessToken cookie browser automatically
             * পরবর্তী request-এ পাঠাবে।
             */
            return api(originalRequest);
        } catch (refreshError) {
            /*
             * Refresh token-ও invalid/expired হলে
             * local auth state clear করা হবে।
             *
             * Sensitive note cache-ও clear করা হবে।
             */
            if (typeof window !== 'undefined') {
                const { useAuthStore } =
                    await import('@/store/useAuthStore');

                const { useNotesStore } =
                    await import('@/store/useNotesStore');

                const { useNotebookStore } =
                    await import('@/store/useNotebookStore');

                useAuthStore.getState().logout();
                useNotesStore.getState().clearNotes();
                useNotebookStore.getState().clearNotebooks();

                window.location.replace(
                    '/login?callbackUrl=/dashboard'
                );
            }

            return Promise.reject(refreshError);
        }
    }
);