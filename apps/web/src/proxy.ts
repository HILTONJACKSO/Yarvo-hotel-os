import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that DO NOT require authentication
const PUBLIC_PATHS = [
  '/', '/login', '/signup', '/booking', '/api/', '/_next/', 
  '/favicon.ico', '/logo.jpg', '/logo.png', '/manifest.webmanifest', 
  '/icon', '/sw.js', '/icon-512.jpg', '/uploads/', '/dining', 
  '/stay', '/events', '/gallery', '/kwalee-', '/yarvo-', '/sitemap', '/robots.txt', '/llms.txt'
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static files (images, fonts, scripts, manifests, sitemaps, etc.)
  if (
    pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|webmanifest|json|xml|txt)$/i) ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  // Use exact match for '/' or startsWith for other paths
  const isPublic = PUBLIC_PATHS.some((path) => 
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  );

  // Check for the accessToken cookie set by the NestJS API
  const accessToken = request.cookies.get('accessToken')?.value;
  const isAuthenticated = Boolean(accessToken);

  // Helper to extract roles from JWT accessToken
  let isSuperAdmin = false;
  if (accessToken) {
    try {
      const parts = accessToken.split('.');
      if (parts.length >= 2) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        if (Array.isArray(payload.roles)) {
          isSuperAdmin = payload.roles.some((r: any) => 
            typeof r === 'string' ? r.toUpperCase() === 'SUPER_ADMIN' : r?.name?.toUpperCase() === 'SUPER_ADMIN'
          );
        }
      }
    } catch {
      // Ignore token parsing error
    }
  }

  if (!isPublic && !isAuthenticated) {
    // Redirect unauthenticated users to login, preserving the intended URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && isAuthenticated) {
    // Redirect already-authenticated users to their home dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: [
    // Match all request paths except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

