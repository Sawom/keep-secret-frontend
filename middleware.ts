import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // ব্যাকএন্ড থেকে সেট করা এক্সেস টোকেন কুকি চেক করা
    const token = request.cookies.get('accessToken')?.value;
    const { pathname } = request.url ? new URL(request.url) : { pathname: request.nextUrl.pathname };

    // ইউজার যদি লগইন করা না থাকে এবং সে যদি /dashboard দিয়ে শুরু হওয়া কোনো পেজে যেতে চায়
    if (!token && pathname.startsWith('/dashboard')) {
        const loginUrl = new URL('/login', request.url);
        // ইউজারকে লগইন করার পর আবার সে যে পেজে যেতে চেয়েছিল সেখানে ফিরিয়ে নেওয়ার জন্য (Optional)
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // অলরেডি লগইন করা থাকলে কেউ যেন আবার ভুল করে /login বা /register পেজে যেতে না পারে (চাইলে রাখতে পারো)
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// কোন কোন রুটে এই মিডলওয়্যার কাজ করবে তা এখানে বলে দিতে হবে
export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register'],
};