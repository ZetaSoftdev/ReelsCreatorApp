import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  
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
  
  try {
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const sortBy = url.searchParams.get('sortBy') || 'uploadedAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    // Calculate pagination values
    const skip = (page - 1) * pageSize;
    
    // Build filters
    const filters: any = {};
    
    // Add search filter if provided (search in title or filename)
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Add status filter if provided
    if (status) {
      filters.status = status;
    }
    
    // Count total videos with filters
    const totalVideos = await prisma.video.count({
      where: filters
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalVideos / pageSize);
    
    // Get videos with pagination and sorting
    const videos = await prisma.video.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: pageSize
    });
    
    // Get video counts by status
    const videosByStatus = await prisma.video.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    // Get total storage used
    const storageData = await prisma.video.aggregate({
      _sum: {
        fileSize: true
      }
    });
    
    // Get average processing time
    const processingData = await prisma.video.findMany({
      where: {
        processedAt: { not: null },
        status: "completed"
      },
      select: {
        uploadedAt: true,
        processedAt: true
      }
    });
    
    // Calculate average processing time in seconds
    let totalProcessingTime = 0;
    processingData.forEach(video => {
      if (video.processedAt && video.uploadedAt) {
        totalProcessingTime += (video.processedAt.getTime() - video.uploadedAt.getTime()) / 1000;
      }
    });
    
    const avgProcessingTime = processingData.length > 0 
      ? Math.round(totalProcessingTime / processingData.length) 
      : 0;
    
    // Get video counts by day for the past 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    /* Original code that uses $queryRaw
    const videoUploadTrend = await prisma.$queryRaw`
      SELECT DATE(v."uploadedAt") as date, COUNT(*) as count
      FROM "Video" v
      WHERE v."uploadedAt" >= ${thirtyDaysAgo}
      GROUP BY DATE(v."uploadedAt")
      ORDER BY date ASC
    `;
    */
    
    // Simpler version that doesn't use raw SQL
    const videosForTrend = await prisma.video.findMany({
      where: {
        uploadedAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        uploadedAt: true
      }
    });
    
    // Process the data to get daily counts
    const dailyCounts = new Map();
    videosForTrend.forEach(video => {
      const dateString = video.uploadedAt.toISOString().split('T')[0];
      dailyCounts.set(dateString, (dailyCounts.get(dateString) || 0) + 1);
    });
    
    const videoUploadTrend = Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    return NextResponse.json({
      videos,
      pagination: {
        total: totalVideos,
        pageSize,
        currentPage: page,
        totalPages
      },
      metadata: {
        videosByStatus,
        storageUsed: storageData._sum.fileSize || 0,
        avgProcessingTime,
        videoUploadTrend
      }
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

// API route to update video status
export async function PATCH(request: Request) {
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
  
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.id || !data.status) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }
    
    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: data.id }
    });
    
    if (!video) {
      return new NextResponse(JSON.stringify({ error: "Video not found" }), {
        status: 404,
      });
    }
    
    // Update video status
    const updatedVideo = await prisma.video.update({
      where: { id: data.id },
      data: {
        status: data.status,
        ...(data.status === 'completed' && !video.processedAt ? { processedAt: new Date() } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedVideo);
  } catch (error) {
    console.error("Error updating video:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

// API route to delete a video
export async function DELETE(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
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
  
  // Validate video ID
  if (!id) {
    return new NextResponse(JSON.stringify({ error: "Missing video ID" }), {
      status: 400,
    });
  }
  
  try {
    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id }
    });
    
    if (!video) {
      return new NextResponse(JSON.stringify({ error: "Video not found" }), {
        status: 404,
      });
    }
    
    // Delete the video
    await prisma.video.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 