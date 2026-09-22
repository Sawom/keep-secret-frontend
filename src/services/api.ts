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

        /*
         * 401 ছাড়া অন্য error হলে এখানে কিছু করার দরকার নেই।
         */
        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }

        /*
         * Login / refresh / logout request নিজেরাই auth-related।
         * এগুলোতে 401 হলে আবার refresh করার চেষ্টা করা যাবে না।
         */
        const requestUrl = originalRequest.url || '';

        if (
            requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/refresh') ||
            requestUrl.includes('/auth/logout')
        ) {
            return Promise.reject(error);
        }

        /*
         * Homepage public page।
         *
         * Homepage-এ /auth/profile 401 হওয়া normal।
         * তাই homepage থেকে user-কে login page-এ redirect করা যাবে না।
         */
        const isHomepage =
            typeof window !== 'undefined' &&
            window.location.pathname === '/';

        originalRequest._retry = true;

        try {
            /*
             * Access token expired হলে refresh করার চেষ্টা।
             */
            await refreshAccessToken();

            /*
             * Refresh সফল হলে original request আবার চালানো হবে।
             */
            return api(originalRequest);
        } catch (refreshError) {
            /*
             * Homepage-এ session না থাকাটা normal।
             * তাই এখানে redirect করা যাবে না।
             */
            if (isHomepage) {
                return Promise.reject(refreshError);
            }

            /*
             * Protected area-তে refresh token invalid/expired।
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