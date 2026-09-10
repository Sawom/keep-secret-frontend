'use client';

export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();

    useEffect(() => {
        // ব্যাকএন্ড অলريডি HttpOnly কুকি সেট করে দিয়েছে, তাই সরাসরি ড্যাশবোর্ডে রিডাইরেক্ট
        const timer = setTimeout(() => {
            router.replace('/dashboard');
        }, 500);

        return () => clearTimeout(timer);
    }, [router]);

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