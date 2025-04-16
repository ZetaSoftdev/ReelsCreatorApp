import { NextResponse } from 'next/server';

// Simple health check endpoint that doesn't use Prisma
// This helps the client check if the server is responsive before making requests
export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Server is experiencing issues'
    }, { 
      status: 500 
    });
  }
} 