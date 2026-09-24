import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];
const REDIRECT_LOGGED_IN_PATHS = ['/login', '/signup', '/forgot-password'];

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const pathname = req.nextUrl.pathname;
  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  if (!isLoggedIn && !isPublicPage) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && REDIRECT_LOGGED_IN_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/today', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api/auth|api/cron|api/stripe/webhook|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|css|js|map|woff2?|ttf|otf)$).*)',
  ],
};
