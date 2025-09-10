import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import createMiddleware from 'next-intl/middleware';

// Define protected routes that require authentication
const protectedRoutes = [
    '/user',
    '/seller',
    '/checkout',
    '/profile',
    '/account-management',
    '/chatbox',
    '/bid'
];

// Define public routes that don't require authentication
const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth',
    '/2fa'
];

// Create next-intl middleware with direct configuration
const intlMiddleware = createMiddleware({
    locales: ['en', 'vi', 'zh', 'ru'],
    defaultLocale: 'en',
    localePrefix: 'always'
});

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const response = intlMiddleware(request);

    // Check if it's a protected route
    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(route)
    );

    // Skip auth check for public routes and static assets
    if (
        publicRoutes.some(
            (route) => pathname === route || pathname.startsWith(route)
        ) ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico' ||
        pathname.startsWith('/images') ||
        pathname.startsWith('/public')
    ) {
        return response;
    }

    // Get session using NextAuth's auth() helper
    const session = await auth();

    // If the route is protected and no session exists, redirect to /login
    if (isProtectedRoute && !session) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', encodeURI(request.url));
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|images|public|api).*)']
};
