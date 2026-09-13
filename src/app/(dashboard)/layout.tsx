'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, } from 'next/navigation';
import { Trash2, Edit3, Archive, Menu, Loader2, Pin, Settings, User, Bell } from 'lucide-react';
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
    // const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        { name: 'Notes', href: '/dashboard', icon: Pin },
        { name: 'Reminders', href: '/dashboard/reminders', icon: Bell },
        { name: 'Edit labels', href: '/dashboard/labels', icon: Edit3 },
        { name: 'Archive', href: '/dashboard/archive', icon: Archive },
        { name: 'Trash', href: '/dashboard/trash', icon: Trash2 },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
            {/* Top Navigation Bar (Google Keep Style Header) */}
            <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    {/* Sidebar Toggle Button */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <Link href="/" className="flex items-center gap-2 cursor-pointer">
                        <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center font-bold text-zinc-900">
                            K
                        </div>
                        <h1 className="text-xl font-medium text-zinc-700 dark:text-zinc-200 hidden sm:block">
                            Keep Secret
                        </h1>
                    </Link>
                </div>

                {/* Right side Profile / Settings / Theme / Logout */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/profile"
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300"
                        title="Profile"
                    >
                        <User className="w-5 h-5" />
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>
                </div>
            </header>

            {/* Body Layout with Sidebar and Main Content */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* মোবাইল স্ক্রিনের জন্য ব্যাকগ্রাউন্ড ওভারলে (Sidebar খোলা থাকলে ক্লিক করলে বন্ধ হয়ে যাবে) */}
                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/20 z-20 md:hidden"
                    />
                )}

                {/* Google Keep Style Sidebar with Overlay for Mobile */}
                <aside
                    className={`transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col z-30 absolute inset-y-0 left-0 md:relative ${isSidebarOpen
                            ? 'w-64 translate-x-0 shadow-2xl md:shadow-none'
                            : '-translate-x-full md:translate-x-0 md:w-20'
                        }`}
                >
                    <nav className="flex-1 py-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => {
                                        // মোবাইলে কোনো লিংকে ক্লিক করলে সাইডবার অটো বন্ধ হয়ে যাবে
                                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                                    }}
                                    className={`flex items-center gap-4 px-6 py-3 rounded-r-full text-sm font-medium transition-colors mx-0 ${isActive
                                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 min-w-[20px]" />
                                    {/* মোবাইলে সাইডবার খুললে লেখা দেখাবে, ডেস্কটপে isSidebarOpen এর ওপর ডিপেন্ড করবে */}
                                    <span className={`${!isSidebarOpen && 'md:hidden'} truncate`}>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Button inside Sidebar */}
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                        <LogoutButton />
                    </div>

                    {/* Theme Toggle inside Sidebar */}
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 mb-4">
                        <ThemeToggle />
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
                    {children}
                </main>
            </div>





        </div>
    );


}