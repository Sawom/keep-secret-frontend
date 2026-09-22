'use client';

import { useState } from 'react';
import { api } from '@/services/api';
import { LogOut, Loader2 } from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useNotebookStore } from '@/store/useNotebookStore';

export default function LogoutButton() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    //  : Auth এবং Notes/Notebook Zustand cache clear করার জন্য store actions নেওয়া হচ্ছে।
    const logoutAuth = useAuthStore((state) => state.logout);
    const clearNotes = useNotesStore((state) => state.clearNotes);
    const clearNotebooks = useNotebookStore(
        (state) => state.clearNotebooks
    );

    //  : Logout এখন server session + client memory cache দুটোই clear করবে।
    const handleLogout = async () => {
        if (isLoggingOut) return;

        try {
            setIsLoggingOut(true);

            // ব্যাকএন্ডের logout এন্ডপয়েন্টে POST রিকোয়েস্ট পাঠানো
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            /*
             *  :
             *
             * Backend logout success হোক বা fail হোক,
             * browser-এর in-memory sensitive data clear করা হবে।
             *
             * এতে logout-এর পরে আগের user's notes/notebooks
             * Zustand cache-এ থেকে যাবে না।
             */

            clearNotes();
            clearNotebooks();
            logoutAuth();

            setIsLoggingOut(false);

            /*
             *  :
             *
             * window.location.href ব্যবহার করলে নতুন document load হবে।
             * এতে আগের protected page-এর React state/UI memory-ও
             * সম্পূর্ণভাবে reset হবে।
             */
            window.location.href = '/';
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="items-center gap-3 px-4 py-3  rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 cursor-pointer"
        >
            {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <LogOut className="w-4 h-4" />
            )}

            <span>
                {isLoggingOut ? 'Logging out...' : ''}
            </span>
        </button>
    );
}