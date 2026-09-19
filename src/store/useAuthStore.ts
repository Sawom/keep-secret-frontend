import { create } from 'zustand';

interface AuthState {
    user: any | null;

    setUser: (user: any) => void;

    logout: () => void;
}

export const useAuthStore =
    create<AuthState>((set) => ({
        user: null,

        setUser: (user) =>
            set({
                user,
            }),

        logout: () =>
            set({
                user: null,
            }),
    }));

// Access token আর রাখার দরকার নেই।
// কেন? কারণ: HttpOnly cookie
// এর উদ্দেশ্যই হলো JS যেন token read করতে না পারে।
// তাই Zustand-এ access token রাখা security architecture-এর সাথে যায় না।