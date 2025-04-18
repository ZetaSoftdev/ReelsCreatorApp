import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from '@/lib/railway-prisma';
import { Role } from "@/lib/constants";

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// Define the Params type
type Params = {
  params: {
    id: string;
  };
};

// GET - Fetch a specific user with details
export async function GET(
  req: NextRequest,
  params: Params
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized access" }), {
        status: 401,
      });
    }
    
    // Check if user is an admin - compare using string value for safety
    if (session.user.role?.toString() !== "ADMIN") {
      return new NextResponse(JSON.stringify({ message: "Forbidden: Admin access required" }), {
        status: 403,
      });
    }

    const userId = params.params.id;
    
    // Get PrismaClient instance from our Railway-specific implementation
    const prismaClient = getPrismaClient();
    
    try {
      // Fetch user details with subscription and videos
      const user = await prismaClient.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          subscription: true,
          videos: {
            take: 5, // Limit to most recent 5 videos
          },
        },
      });
      
      if (!user) {
        return new NextResponse(JSON.stringify({ message: "User not found" }), {
          status: 404,
        });
      }
      
      return NextResponse.json(user);
    } catch (dbError) {
      throw dbError;
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
    return new NextResponse(JSON.stringify({ message: "An error occurred while fetching user details" }), {
      status: 500,
    });
  }
}

// PATCH - Update user role
export async function PATCH(
  req: NextRequest,
  params: Params
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized access" }), {
        status: 401,
      });
    }
    
    // Check if user is an admin - compare using string value for safety
    if (session.user.role?.toString() !== "ADMIN") {
      return new NextResponse(JSON.stringify({ message: "Forbidden: Admin access required" }), {
        status: 403,
      });
    }

    const userId = params.params.id;
    
    // Parse request body
    const body = await req.json();
    
    // Validate role
    const { role } = body;
    
    if (role && !Object.values(Role).includes(role as Role)) {
      return new NextResponse(JSON.stringify({ message: "Invalid role" }), {
        status: 400,
      });
    }
    
    // Get PrismaClient instance from our Railway-specific implementation
    const prismaClient = getPrismaClient();
    
    try {
      // Update user in database
      const updatedUser = await prismaClient.user.update({
        where: {
          id: userId,
        },
        data: {
          role: role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      
      return NextResponse.json(updatedUser);
    } catch (dbError) {
      throw dbError;
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse(JSON.stringify({ message: "An error occurred while updating the user" }), {
      status: 500,
    });
  }
}

// DELETE - Delete a user
export async function DELETE(
  req: NextRequest,
  params: Params
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized access" }), {
        status: 401,
      });
    }
    
    // Check if user is an admin - compare using string value for safety
    if (session.user.role?.toString() !== "ADMIN") {
      return new NextResponse(JSON.stringify({ message: "Forbidden: Admin access required" }), {
        status: 403,
      });
    }

    const userId = params.params.id;
    
    // Prevent deleting your own account
    if (userId === session.user.id) {
      return new NextResponse(JSON.stringify({ message: "You cannot delete your own account" }), {
        status: 400,
      });
    }
    
    // Get PrismaClient instance from our Railway-specific implementation
    const prismaClient = getPrismaClient();
    
    try {
      // Delete user
      await prismaClient.user.delete({
        where: {
          id: userId,
        },
      });
      
      return new NextResponse(JSON.stringify({ message: "User deleted successfully" }), {
        status: 200,
      });
    } catch (dbError) {
      throw dbError;
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse(JSON.stringify({ message: "An error occurred while deleting the user" }), {
      status: 500,
    });
  }
} 