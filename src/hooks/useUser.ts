'use client';

import { api } from '@/services/api';
import { useState, useEffect } from 'react';

export function useUser() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // ব্যাকএন্ডের প্রটেক্টেড রাউট থেকে কুকি দিয়ে ইউজার ডাটা আনা
                const res: any = await api.get('/auth/profile');
                setUser(res.user);
            } catch (err) {
                // টোকেন না থাকলে বা এক্সপায়ার হলে ইউজার null হয়ে যাবে
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return { user, loading, setUser };
}