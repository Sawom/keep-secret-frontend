'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Invalid or missing reset token.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword({ token, newPassword });
            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Token may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Set New Password</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Please enter your secure new password</p>
            </div>

            {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900">
                    {error}
                </div>
            )}

            {success ? (
                <div className="p-4 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-900 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                    <p className="font-medium">Password successfully reset!</p>
                    <p className="text-xs text-zinc-500">Redirecting to login page...</p>
                </div>
            ) : (
                <form onSubmit={handleReset} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                    </button>
                </form>
            )}

            <div className="text-center mt-6">
                <Link href="/login" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                    Remember your password? Sign In
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                    <p className="text-sm text-zinc-500">Loading...</p>
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}