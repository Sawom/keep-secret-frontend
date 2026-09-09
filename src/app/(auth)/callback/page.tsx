'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setToken = useAuthStore((state) => state.setToken);

    useEffect(() => {
        // ব্যাকএন্ড সাধারণত টোকেনটি কোয়েরি প্যারামিটার হিসেবে পাঠাতে পারে (যেমন: ?token=xyz)
        const token = searchParams.get('token');

        if (token) {
            setToken(token);
            router.push('/dashboard');
        } else {
            // টোকেন না পেলে লগইন পেজে পাঠিয়ে দেবো
            router.push('/login?error=GoogleAuthFailed');
        }
    }, [searchParams, setToken, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Authenticating with Google, please wait...</p>
        </div>
    );
}