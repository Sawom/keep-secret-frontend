'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const searchParams = useSearchParams();
    const isRegistered = searchParams.get('registered');

    // এখানে callbackUrl টি ঠিকভাবে ধরে নেওয়া হলো (না থাকলে ডিফল্ট /dashboard থাকবে)
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const handleLogin = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            await authService.login({
                email,
                password,
            });

            // Backend HttpOnly cookie set করেছে।
            // Frontend থেকে token read/set করার দরকার নেই।

            window.location.href = callbackUrl;
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                'Something went wrong during login!'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Welcome Back</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sign in to access your zero-knowledge encrypted notes</p>
            </div>

            {/* রেজিস্টার সফল হলে এই মেসেজটি দেখাবে */}
            {isRegistered && (
                <div className="mb-4 p-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900">
                    Registration successful! Please sign in with your credentials.
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                        <Link href="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Forgot?</Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                </button>
            </form>

            {/* google login */}
            <div className="mt-4">
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                    <span className="flex-shrink mx-4 text-xs text-zinc-400 uppercase">Or continue with</span>
                    <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        const backendUrl = process.env.NEXT_PUBLIC_API_URL;
                        window.location.href = `${backendUrl}/auth/google`;
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-200 font-medium rounded-lg transition-colors text-sm"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                    </svg>
                    Sign in with Google
                </button>
            </div>

            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-6">
                Don't have an account? <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Create account</Link>
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
            <Suspense fallback={
                <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                    <p className="text-sm text-zinc-500">Loading...</p>
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}