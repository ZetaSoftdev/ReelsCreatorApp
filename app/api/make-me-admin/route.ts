import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from '@prisma/client';

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// Fallback to a new PrismaClient if the shared instance fails
const getPrismaClient = () => {
  try {
    return prisma;
  } catch (error) {
    console.warn('Falling back to new PrismaClient instance');
    return new PrismaClient();
  }
};

// POST - Make the current user an admin
export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    
    // Get the user ID from the session
    const userId = session.user.id;
    
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "User ID not found in session" }), {
        status: 400,
      });
    }
    
    console.log(`Attempting to make user with ID ${userId} an admin`);
    
    const prismaClient = getPrismaClient();
    
    // Update user role to ADMIN
    const updatedUser = await prismaClient.user.update({
      where: {
        id: userId,
      },
      data: {
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    
    console.log(`User role updated:`, updatedUser);
    
    return NextResponse.json({
      success: true,
      message: "Your account has been updated to admin role",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to update role", 
      details: (error as Error).message 
    }), {
      status: 500,
    });
  }
} 