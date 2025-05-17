import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";

/**
 * GET: Preview a video file by filename
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const filename = params.filename;
    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }
    
    // Security check: Make sure the filename doesn't contain path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }
    
    // Construct the file path
    const filePath = path.join(process.cwd(), 'public', 'editedClips', filename);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    // Get file stats
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    
    // Get range from request headers
    const range = req.headers.get("range");
    
    if (range) {
      // Handle range request
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      const responseHeaders = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": "video/mp4",
      };
      
      return new NextResponse(file as any, {
        status: 206,
        headers: responseHeaders,
      });
    } else {
      // Handle non-range request
      const responseHeaders = {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
      };
      
      return new NextResponse(fs.createReadStream(filePath) as any, {
        status: 200,
        headers: responseHeaders,
      });
    }
  } catch (error: any) {
    console.error("Error serving video file:", error);
    return NextResponse.json(
      { error: "Failed to serve video file", details: error.message },
      { status: 500 }
    );
  }
} 