'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, User, Settings, Loader2 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LogoutButton from '@/components/LogoutButton';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/services/api';

export default function DashboardGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const setAccessToken = useAuthStore((state) => state.setAccessToken);

    // ড্যাশবোর্ড লেআউটে ঢোকার সাথেই সেশন ও রিফ্রেশ টোকেন চেক করা হচ্ছে
    useEffect(() => {
        const verifySession = async () => {
            const currentToken = useAuthStore.getState().accessToken;

            // যদি মেমোরিতে টোকেন না থাকে, তবে কুকি ব্যবহার করে ব্যাকএন্ড থেকে টোকেন রিকভার করার চেষ্টা করব
            if (!currentToken) {
                try {
                    const res: any = await api.post('/auth/refresh', {});
                    if (res?.accessToken) {
                        setAccessToken(res.accessToken);
                    }
                } catch (err) {
                    // রিফ্রেশ টোকেনও মেয়াদোত্তীর্ণ বা ইনভ্যালিড হলে তবেই লগইন পেজে পাঠাবে
                    window.location.replace('/login?callbackUrl=/dashboard');
                    return;
                }
            }
            setIsCheckingAuth(false);
        };

        verifySession();
    }, [setAccessToken]);

    // টোকেন ভেরিফাই না হওয়া পর্যন্ত লোডিং স্পিনার দেখাবে, যাতে হুট করে লগইন পেজে ফ্লিকার না করে
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">
            {/* Google Keep Style Sidebar */}
            <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                        <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                            Keep Secret
                        </h1>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <LogoutButton />
                </div>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                    <ThemeToggle />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}