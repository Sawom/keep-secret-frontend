'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api'; // তোমার ব্যাকএন্ড API সার্ভিস পাথ
import { LogOut, Loader2 } from 'lucide-react';

export default function LogoutButton() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            // ব্যাকএন্ডের logout এন্ডপয়েন্টে POST রিকোয়েস্ট পাঠানো
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
            // লগআউট হওয়ার পর হোম পেজে রিডাইরেক্ট করে পেজ রিফ্রেশ বা ক্যাশ ক্লিয়ার করা
            window.location.href = '/';
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 cursor-pointer"
        >
            {isLoggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <LogOut className="w-5 h-5" />
            )}
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
    );
}