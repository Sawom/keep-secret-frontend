'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, User as UserIcon, ShieldCheck } from 'lucide-react';
import { authService } from '@/services/auth.service';

interface UserProfile {
    id: string;
    email: string;
    name: string;
}

export default function DashboardPage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response: any = await authService.getProfile();

                setUser(response.user);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    'Failed to load profile'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                    Welcome to your Dashboard! 🎉
                </h2>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Here is your account profile information retrieved securely.
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400 text-2xl font-bold">
                        {user?.name
                            ? user.name.charAt(0).toUpperCase()
                            : 'U'}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                            {user?.name || 'Google User'}
                        </h3>

                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full mt-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified Account
                        </span>
                    </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-4">
                    <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                        <UserIcon className="w-5 h-5 text-zinc-400" />

                        <div>
                            <p className="text-xs text-zinc-400">
                                User ID
                            </p>

                            <p className="text-sm font-mono">
                                {user?.id}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                        <Mail className="w-5 h-5 text-zinc-400" />

                        <div>
                            <p className="text-xs text-zinc-400">
                                Email Address
                            </p>

                            <p className="text-sm font-medium">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}