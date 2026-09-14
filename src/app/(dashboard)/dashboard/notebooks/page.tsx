'use client';

import React, { useEffect, useState } from 'react';
import { notebookService, Notebook } from '@/services/notebook.service';
import { Folder, Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NotebooksPage() {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

    // ফর্ম ইনপুট স্টেট
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [submitting, setSubmitting] = useState(false);

    // ১. নোটবুক ফেচ করার ফাংশন
    const fetchNotebooks = async () => {
        try {
            setLoading(true);
            const data = await notebookService.getNotebooks();
            setNotebooks(data);
        } catch (error) {
            console.error('Failed to fetch notebooks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotebooks();
    }, []);

    // ২. নতুন নোটবুক ক্রিয়েট সাবমিট হ্যান্ডলার
    const handleCreateNotebook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            setSubmitting(true);
            await notebookService.createNotebook({
                title,
                description,
                color,
                icon: 'book',
            });
            // ইনপুট রিসেট এবং মোডাল বন্ধ করা
            setTitle('');
            setDescription('');
            setColor('#3B82F6');
            setIsCreateModalOpen(false);
            fetchNotebooks(); // লিস্ট রিফ্রেশ করা
        } catch (error) {
            console.error('Failed to create notebook:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // ৩. নোটবুক ডিলিট হ্যান্ডলার
    const handleDeleteNotebook = async (id: string) => {
        if (!confirm('Are you sure you want to delete this notebook? Notes inside will not be deleted.')) return;

        try {
            await notebookService.deleteNotebook(id);
            setNotebooks(notebooks.filter((item) => item.id !== id));
        } catch (error) {
            console.error('Failed to delete notebook:', error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* পেজ হেডার এবং নিউ বাটন */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Notebooks</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Organize your encrypted notes into chapters and projects.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    New Notebook
                </button>
            </div>

            {/* লোডিং অথবা এম্প্টি স্টেট */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : notebooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 space-y-3 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <BookOpen className="w-12 h-12 stroke-[1.5]" />
                    <p className="text-base font-medium">No notebooks found</p>
                    <p className="text-xs text-zinc-400">Create your first notebook to start organizing notes.</p>
                </div>
            ) : (
                /* নোটবুক গ্রিড লেআউট */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {notebooks.map((notebook) => (
                        <div
                            key={notebook.id}
                            className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                                        style={{ backgroundColor: notebook.color || '#3B82F6' }}
                                    >
                                        <Folder className="w-5 h-5" />
                                    </div>
                                    <button
                                        onClick={() => handleDeleteNotebook(notebook.id)}
                                        className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                        title="Delete Notebook"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 text-base">
                                        {notebook.title}
                                    </h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-xs line-clamp-2 mt-1">
                                        {notebook.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-500">
                                <span>{notebook._count?.notes || 0} notes</span>
                                <Link
                                    href={`/dashboard/notebooks/${notebook.id}`}
                                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                                >
                                    Open →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* নতুন নোটবুক তৈরির পপআপ মোডাল (Modal) */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create New Notebook</h2>

                        <form onSubmit={handleCreateNotebook} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. My Novel 2026, Office ERP"
                                    className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What is this notebook about?"
                                    className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 resize-none h-20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Theme Color</label>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-full h-10 px-1 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}