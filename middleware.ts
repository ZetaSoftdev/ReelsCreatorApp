import { NextRequest, NextResponse } from 'next/server'
import { auth } from './auth'
import { Role } from './lib/constants'

// The core middleware function
export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const path = request.nextUrl.pathname
  
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
    '/services'
  ].includes(path)

  // Define admin-only paths
  const isAdminPath = path.startsWith('/admin')
  
  // Get the authentication session
  const session = await auth()
  
  // If user is authenticated
  if (session?.user) {
    // Get the user's role (default to USER if undefined)
    const userRole = session.user.role || Role.USER
    
    console.log(`[Middleware] Authenticated user accessing ${path} with role: ${userRole}`)
    
    // Redirect authenticated users away from login/signup pages
    if (['/login', '/sign-up'].includes(path)) {
      if (userRole === Role.ADMIN) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard/home', request.url))
      }
    }
    
    // Check admin page access
    if (isAdminPath && userRole !== Role.ADMIN) {
      console.log(`[Middleware] Unauthorized access attempt to ${path} by role: ${userRole}`)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    
    // For all other paths, allow access
    return NextResponse.next()
  } 
  
  // For unauthenticated users
  console.log(`[Middleware] Unauthenticated user accessing ${path}`)
  
  // Allow access to public paths
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Redirect to login for all other paths
  return NextResponse.redirect(new URL('/login', request.url))
}

// Configure matcher for middleware
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image).*)'],
} 