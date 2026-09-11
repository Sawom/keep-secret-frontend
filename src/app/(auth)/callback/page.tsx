'use client';

export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            // ১. ব্যাকএন্ড থেকে আসা টোকেনটি ব্রাউজারে কুকি হিসেবে সেট করা
            document.cookie = `accessToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; Secure; SameSite=None`;
        }

        // ২. কুকি সেট হওয়ার পর ড্যাশবোর্ডে রিডাইরেক্ট (হার্ড রিফ্রেশ সহ দিলে সবচয়ে সেফ)
        const timer = setTimeout(() => {
            window.location.href = '/dashboard';
        }, 500);

        return () => clearTimeout(timer);
    }, [token]);

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