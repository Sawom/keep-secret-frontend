'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trash2, Edit3, Archive, Menu, Loader2, Pin, Settings, User, BookOpen, Bell, Image as ImageIcon, CheckSquare, Palette } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LogoutButton from '@/components/LogoutButton';
import { api } from '@/services/api';
import { noteService } from '@/services/note.service';
import SearchBar from '@/components/SearchBar';

export default function DashboardGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    // const setAccessToken = useAuthStore((state) => state.setAccessToken);

    // auth checking
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    // Google Keep States
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Take a note modal states
    const [isNoteExpanded, setIsNoteExpanded] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteBody, setNoteBody] = useState('');

    // handle save
    const [isSaving, setIsSaving] = useState(false);
    const isSavingRef = useRef(false);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ড্যাশবোর্ড লেআউটে ঢোকার সাথেই সেশন ও রিফ্রেশ টোকেন চেক করা হচ্ছে
    useEffect(() => {
        const verifySession =
            async () => {
                try {
                    /*
                     * HttpOnly cookie browser automatically পাঠাবে।
                     * Frontend কখনো accessToken পড়বে না।
                     */
                    await api.get('/auth/profile');

                    setIsCheckingAuth(false);
                } catch {
                    /*
                     * Access token expired হলে refresh endpoint
                     * নতুন HttpOnly cookie set করবে।
                     */
                    try {
                        await api.post('/auth/refresh', {});

                        /*
                         * Refresh সফল হয়েছে কিনা নিশ্চিত করতে
                         * profile আবার check করছি।
                         */
                        await api.get('/auth/profile');

                        setIsCheckingAuth(false);
                    } catch {
                        window.location.replace(
                            '/login?callbackUrl=/dashboard'
                        );
                    }
                }
            };

        /*
        * Normal dashboard load।
        */

        verifySession();

        /*
     * Browser Back / Forward করলে browser অনেক সময়
     * bfcache থেকে পুরোনো page restore করে।
     *
     * সেই ক্ষেত্রে আবার পুরো page reload করবো।
     *
     * তারপর dashboard-এর auth check আবার চলবে।
     * Logout করা থাকলে /login-এ চলে যাবে।
     */
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                window.location.reload();
            }
        };

        window.addEventListener(
            'pageshow',
            handlePageShow
        );

        return () => {
            window.removeEventListener(
                'pageshow',
                handlePageShow
            );
        };

    }, []);

    // ১. মূল সেভ ফাংশন
    const handleSaveNote = async () => {
        if (!noteTitle.trim() && !noteBody.trim()) return;
        if (isSavingRef.current || isSaving) return;

        isSavingRef.current = true;
        setIsSaving(true);

        try {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }

            await noteService.createNote({
                title: noteTitle.trim() || 'Untitled Note',
                content: noteBody.trim(),
                color: '#FFFFFF',
                isPinned: false
            });
            setNoteTitle('');
            setNoteBody('');
            setIsNoteExpanded(false);

            window.dispatchEvent(new CustomEvent('note-saved'));
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    };

    // অটো-সেভ ডিবাউন্স ইফেক্ট
    useEffect(() => {
        if (isCheckingAuth || !isNoteExpanded || (!noteTitle.trim() && !noteBody.trim())) return;

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            handleSaveNote();
        }, 10000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [noteTitle, noteBody, isNoteExpanded, isCheckingAuth]);

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm font-medium">Loading workspace...</p>
            </div>
        );
    }

    const navItems = [
        { name: 'Profile', href: '/dashboard', icon: User },
        { name: 'Notes', href: '/dashboard/notes', icon: Pin },
        { name: 'Notebooks', href: '/dashboard/notebooks', icon: BookOpen },
        { name: 'Trash', href: '/dashboard/trash', icon: Trash2 },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
            {/* Top Navigation Bar */}
            <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 sticky top-0 z-30 shrink-0 ">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300 transition-colors"
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

                <div className="flex items-center gap-2">
                    <SearchBar />
                    {/* <Link
                        href="/dashboard"
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300"
                        title="Profile"
                    >
                        <User className="w-5 h-5" />
                    </Link> */}
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
            <div className="flex flex-1 min-h-0 relative">
                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/20 z-20 md:hidden"
                    />
                )}

                <aside
                    className={`transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col z-30 fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] ${isSidebarOpen
                        ? 'w-64 translate-x-0 shadow-2xl md:shadow-none'
                        : '-translate-x-full md:translate-x-0 md:w-20'
                        }`}
                >
                    <nav className="flex-1 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => {
                                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                                    }}
                                    className={`flex items-center gap-4 px-6 py-3 rounded-r-full text-sm font-medium transition-colors mx-0 ${isActive
                                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 min-w-[20px]" />
                                    <span className={`${!isSidebarOpen && 'md:hidden'} truncate`}>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 ">
                        <LogoutButton />
                    </div>

                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 mb-12 shrink-0 ">
                        <ThemeToggle />
                    </div>
                </aside>

                <main className="flex-1 min-w-0 min-h-0 overflow-y-auto p-4 md:p-8 w-full flex flex-col items-center">
                    <div className="w-full max-w-2xl mb-8 z-10">
                        <div
                            className={`bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-md transition-all duration-200 ${isNoteExpanded ? 'p-4' : 'px-4 py-3 flex items-center justify-between cursor-pointer hover:shadow-lg'
                                }`}
                            onClick={() => {
                                if (!isNoteExpanded) setIsNoteExpanded(true);
                            }}
                        >
                            {!isNoteExpanded ? (
                                <div className="text-zinc-500 dark:text-zinc-400 text-sm font-medium select-none w-full">
                                    Take a note...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Title"
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none font-semibold text-zinc-800 dark:text-zinc-100 text-base"
                                        autoFocus
                                        required
                                    />

                                    <textarea
                                        placeholder="Take a note..."
                                        value={noteBody}
                                        onChange={(e) => setNoteBody(e.target.value)}
                                        rows={2}
                                        className="w-full bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-300 resize-none max-h-50 overflow-y-[field-sizing:content] [field-sizing:content]"
                                        required
                                    />

                                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                                            {/* empty */}
                                        </div>

                                        <div>
                                            <button
                                                onClick={() => {
                                                    if (autoSaveTimerRef.current) {
                                                        clearTimeout(autoSaveTimerRef.current);
                                                        autoSaveTimerRef.current = null;
                                                    }
                                                    handleSaveNote();
                                                }}
                                                disabled={isSaving}
                                                className="px-4 mx-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await handleSaveNote();
                                                    setIsNoteExpanded(false);
                                                }}
                                                disabled={isSaving}
                                                className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full max-w-4xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}


/*
Logout → Back কীভাবে কাজ করবে
user এখানে: /dashboard/notebooks/123 তারপর Logout:

/dashboard/notebooks/123
       ↓
     Logout
       ↓
     /login

তারপর user browser-এর Back চাপল:
/login
 ↓
Back
 ↓
/dashboard/notebooks/123
 ↓
pageshow
 ↓
reload
 ↓
/auth/profile
 ↓
401
 ↓
refresh
 ↓
401
 ↓
/login?callbackUrl=/dashboard

তাই পুরোনো notebook/dashboard আর usable অবস্থায় ফিরে আসবে না।

*/