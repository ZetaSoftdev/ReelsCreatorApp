import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    
    // Safe version of the session without exposing sensitive data
    const safeSession = session ? {
      user: {
        id: session.user?.id || null,
        email: session.user?.email || null,
        role: session.user?.role || null,
        name: session.user?.name || null,
        image: session.user?.image ? "Image exists" : null,
      },
      expires: session.expires,
    } : null;
    
    return NextResponse.json({
      authenticated: !!session,
      session: safeSession,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Error in debug-auth route:", error);
    return NextResponse.json({
      error: "Failed to fetch auth state",
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 