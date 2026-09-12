import { create } from 'zustand';

interface AuthState {
    accessToken: string | null;
    user: any | null;
    setAccessToken: (token: string | null) => void;
    setUser: (user: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    user: null,
    setAccessToken: (accessToken) => set({ accessToken }),
    setUser: (user) => set({ user }),
    logout: () => set({ accessToken: null, user: null }),
}));