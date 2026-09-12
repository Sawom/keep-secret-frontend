'use client';

export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const setAccessToken = useAuthStore((state) => state.setAccessToken);

    useEffect(() => {
        if (token) {
            // Zustand স্টেটে এক্সেস টোকেন সেভ করা
            setAccessToken(token);
            router.replace('/dashboard');
        } else {
            router.replace('/login');
        }
    }, [token, setAccessToken, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Authenticating with Google, please wait...</p>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}