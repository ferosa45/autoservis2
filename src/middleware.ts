import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const isLoginPage = req.nextUrl.pathname === '/login';

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/today', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Middleware se nespouští na statické soubory a API auth routy
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
