import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // এখানে আমরা কোনো টোকেন চেক করে মিডলওয়্যারকে ব্লক করছি না, 
    // শুধু ব্রাউজারের ব্যাক-বাটন ক্যাশ (bfcache) আটকাতে নো-ক্যাশ হেডার পাস করে দিচ্ছি।
    const response = NextResponse.next();

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
}

export const config = {
    matcher: [
        '/dashboard/:path*',
    ],
};