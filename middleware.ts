import { NextRequest, NextResponse } from 'next/server'
import { auth } from './auth'
import { Role } from './lib/constants'

// Add a helper function at the top of the file
const isAdmin = (role: any): boolean => {
  if (!role) return false;
  if (typeof role === 'string') return role.toUpperCase() === 'ADMIN';
  return role === Role.ADMIN;
};

// The core middleware function
export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const path = request.nextUrl.pathname
  
  console.log(`[Middleware] Processing request for path: ${path}`);
  
  // Skip middleware for Next.js internals and static assets
  if (
    path.startsWith('/_next') || 
    path.startsWith('/images') || 
    path.includes('/favicon.ico') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.svg') ||
    path.endsWith('.gif') ||
    path.endsWith('.webp') ||
    path.endsWith('.mp4') ||
    path.endsWith('.webm') ||
    path.startsWith('/logos/') ||
    path.startsWith('/videos/') ||
    path === '/bg.png' ||
    path === '/video.mp4'
  ) {
    return NextResponse.next()
  }

  // Skip middleware for non-admin API routes
  if (path.startsWith('/api') && !path.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  // Define public paths that don't require authentication
  const isPublicPath = [
    '/login',
    '/sign-up',
    '/unauthorized',
    '/',
    '/pricing',
    '/guides',
    '/services',
    '/features',
    '/contact',
    '/about',
    '/terms',
    '/privacy'
  ].includes(path)

  // Define admin-only paths
  const isAdminPath = path.startsWith('/admin')
  
  // Log the request path and whether it's public/admin
  console.log(`[Middleware] Path: ${path}, Public: ${isPublicPath}, Admin: ${isAdminPath}`);
  
  // Get the authentication session
  const session = await auth()
  
  // If user is authenticated
  if (session?.user) {
    // Get the user's role (default to USER if undefined)
    const userRole = session.user.role || Role.USER
    
    console.log(`[Middleware] Authenticated user: ${session.user.email}`);
    console.log(`[Middleware] User role: ${userRole}`);
    console.log(`[Middleware] User ID: ${session.user.id}`);
    console.log(`[Middleware] Session expiry: ${session.expires}`);
    
    // Redirect authenticated users away from login/signup pages
    if (['/login', '/sign-up'].includes(path)) {
      if (isAdmin(userRole)) {
        console.log(`[Middleware] Redirecting admin from login to admin dashboard`);
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } else {
        console.log(`[Middleware] Redirecting user from login to dashboard`);
        return NextResponse.redirect(new URL('/dashboard/home', request.url))
      }
    }
    
    // Check admin page access
    if (isAdminPath && !isAdmin(userRole)) {
      console.log(`[Middleware] ⚠️ UNAUTHORIZED - User role ${userRole} attempted to access admin path ${path}`);
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    
    // For all other paths, allow access
    console.log(`[Middleware] Access granted to ${path}`);
    return NextResponse.next()
  } 
  
  // For unauthenticated users
  console.log(`[Middleware] Unauthenticated user accessing ${path}`);
  
  // Allow access to public paths
  if (isPublicPath) {
    console.log(`[Middleware] Public path access allowed`);
    return NextResponse.next()
  }
  
  // Redirect to login for all other paths
  console.log(`[Middleware] Redirecting to login`);
  return NextResponse.redirect(new URL('/login', request.url))
}

// Configure matcher for middleware
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image).*)'],
} 