'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, Sparkles, KeyRound, EyeOff, ArrowRight, Loader2, FileText, Layers, Cpu } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import LogoutButton from '@/components/LogoutButton';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/services/api';

export default function HomePage() {
  const [typedText, setTypedText] = useState('Project KeepSecret: Zero-knowledge architecture implementation in progress...');

  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // ড্যাশবোর্ডের মতো সেইম স্টেট নাম ব্যবহার করলাম

  const { user, loading } = useUser();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  // ড্যাশবোর্ডের লেআউটের মতোই হোমপেজেও সেশন চেক ও রিফ্রেশ টোকেন রিকভার করা হচ্ছে
  useEffect(() => {
    const verifySession = async () => {
      const currentToken = useAuthStore.getState().accessToken;

      if (!currentToken) {
        try {
          const res: any = await api.post('/auth/refresh', {});
          if (res?.accessToken) {
            setAccessToken(res.accessToken);
          }
        } catch (err) {
          // হোমপেজে রিফ্রেশ ফেল করলে লগইন পেজে রিডায়রেক্ট করার দরকার নেই, কারণ এটি পাবলিক রুট। 
          // শুধু সেশন নেই ধরে নরমালি লোডিং শেষ করে দেবো।
          console.log('No active session found');
        }
      }
      setIsCheckingAuth(false);
    };

    verifySession();
  }, [setAccessToken]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">

      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-500/15 dark:bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/75 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Keep<span className="text-indigo-600 dark:text-indigo-400">Secret</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* ড্যাশবোর্ডের মতো এখানেও টোকেন চেক শেষ না হওয়া পর্যন্ত লোডিং দেখাবে যাতে ফ্লিকার না করে */}
            {isCheckingAuth ? (
              // পুরো পেজ ঠিক থাকবে, শুধু বাটন এরিয়ায় একটা ছোট স্পিনার বা লোডিং দেখাবে
              <div className="flex items-center gap-2 text-sm text-slate-400 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-xs">Checking...</span>
              </div>
            ) : (useAuthStore.getState().accessToken || user) ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py.5 rounded-xl transition-all shadow-lg shadow-emerald-600/25"
                >
                  Dashboard
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 transition-colors"
              >
                Login
              </Link>
            )}

          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-5 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Database-Level Encryption
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
          Where your personal notes stay <br />
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 dark:from-indigo-400 dark:via-violet-400 dark:to-pink-400 bg-clip-text text-transparent">
            truly confidential.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Not even database administrators can read your thoughts. Pure privacy, encrypted client-side, stored securely.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-indigo-600/25"
          >
            Create Encrypted Vault <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold rounded-2xl transition-all"
          >
            Access Vault
          </Link>
        </div>

        {/* --- Interactive Note App Simulation Box  --- */}
        <div className="mt-14 max-w-3xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 px-4 py-2 bg-indigo-500/10 border-b border-l border-indigo-500/20 rounded-bl-xl text-[11px] text-indigo-400 font-mono flex items-center gap-1.5">
            <Lock className="w-3 h-3 animate-pulse" /> AES-256 Secured
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs text-slate-500 font-mono">keepsecret-vault://secure-notes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sidebar Mock */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">My Notebooks</div>
              <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between">
                <span>🔒 Personal Diary</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              </div>
              <div className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 text-xs transition-colors">🚀 Project Ideas</div>
              <div className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 text-xs transition-colors">💡 Confidential ERP</div>
            </div>

            {/* Note Editor Mock */}
            <div className="sm:col-span-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" /> Secret Meeting Notes
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Synced & Encrypted</span>
                </div>
                <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  {typedText}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                <span>Zero Knowledge Verified</span>
                <span className="text-indigo-400">Status: Protected 🛡️</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Interactive Feature Cards */}
      <section className="py-24 px-5 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-900 transition-colors duration-300">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Built like a fortress</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">Designed for developers, writers, and privacy maximalists.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="group p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-300">
              <EyeOff className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Zero-Knowledge Core</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Data is locked on your browser before hitting our servers. We store ciphertexts, never plaintext.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-violet-500/50 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-violet-500/10">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Notebooks & Chapters</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Organize complex thoughts, project ideas, or journals into custom color-coded notebooks seamlessly.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-pink-500/50 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-pink-500/10">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Smart Trash Lifecycle</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Accidental deletions are safe with soft-delete trash bins, paired with automated cron purging.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} KeepSecret. All rights reserved.</p>
      </footer>
    </div>
  );
}