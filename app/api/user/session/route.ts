import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// This API route returns the current user's session data
export async function GET() {
  try {
    // Get the session data from Next Auth
    const session = await auth();
    
    // If no session exists, return null
    if (!session || !session.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Return a safe version of the user data (without sensitive information)
    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        image: session.user.image,
        // Include a timestamp to prevent caching issues
        timestamp: Date.now()
      }
    }, { 
      status: 200,
      headers: {
        // Prevent caching to ensure we always get fresh data
        'Cache-Control': 'no-store, max-age=0'
      } 
    });
    
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data' },
      { status: 500 }
    );
  }
} 