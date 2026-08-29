import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that DO NOT require authentication
const PUBLIC_PATHS = ['/login', '/api/', '/_next/', '/favicon.ico', '/logo.jpg', '/manifest.webmanifest', '/icon', '/sw.js', '/icon-512.jpg', '/uploads/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // Check for the accessToken cookie set by the NestJS API
  const accessToken = request.cookies.get('accessToken')?.value;
  const isAuthenticated = Boolean(accessToken);

  if (!isPublic && !isAuthenticated) {
    // Redirect unauthenticated users to login, preserving the intended URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && isAuthenticated) {
    // Redirect already-authenticated users away from the login page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/') {
    // Redirect root to appropriate page
    return NextResponse.redirect(
      new URL(isAuthenticated ? '/dashboard' : '/login', request.url)
    );
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: [
    // Match all request paths except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

