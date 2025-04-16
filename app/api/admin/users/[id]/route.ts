import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

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
  const session = await auth();
  
  // Check if user is authenticated
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  // Check if user is an admin
  if (session.user.role !== Role.ADMIN) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  const userId = params.params.id;
  
  try {
    // Fetch user details with subscription and videos
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        subscription: true,
        videos: {
          select: {
            id: true,
            title: true,
            duration: true,
            status: true,
            uploadedAt: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
          take: 5, // Limit to most recent 5 videos
        },
      },
    });
    
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

// PATCH - Update user role
export async function PATCH(
  req: NextRequest,
  params: Params
) {
  const session = await auth();
  
  // Check if user is authenticated
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  // Check if user is an admin
  if (session.user.role !== Role.ADMIN) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  const userId = params.params.id;
  
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate role
    const { role } = body;
    
    if (!role || !Object.values(Role).includes(role as Role)) {
      return new NextResponse(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
      });
    }
    
    // Update user in database
    const updatedUser = await prisma.user.update({
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
  } catch (error) {
    console.error("Error updating user role:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

// DELETE - Delete a user
export async function DELETE(
  req: NextRequest,
  params: Params
) {
  const session = await auth();
  
  // Check if user is authenticated
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  // Check if user is an admin
  if (session.user.role !== Role.ADMIN) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  const userId = params.params.id;
  
  try {
    // Prevent deleting your own account
    if (session.user.id === userId) {
      return new NextResponse(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400,
      });
    }
    
    // Delete user
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });
    
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 