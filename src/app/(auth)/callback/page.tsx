'use client';

export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setToken = useAuthStore((state) => state.setToken);

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            setToken(token);
            router.push('/dashboard');
        } else {
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

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}