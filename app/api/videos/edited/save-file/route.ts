import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Ensure the directory exists
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

export async function POST(req: NextRequest) {
  try {
    console.log("=== POST /api/videos/edited/save-file - Saving edited video file ===");
    
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      console.error("Unauthorized access attempt - no valid session");
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    // Get file data from request
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      console.error("No file received");
      return NextResponse.json(
        { error: "No file received" },
        { status: 400 }
      );
    }
    
    // Create directory if it doesn't exist
    const uploadDir = ensureDirectoryExists(path.join(process.cwd(), "public", "editedClips"));
    
    // Generate a unique filename
    const fileExt = path.extname(file.name) || ".mp4";
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Save the file
    fs.writeFileSync(filePath, buffer);
    
    // Return success response with the file path (relative to public)
    const publicPath = `/editedClips/${uniqueFilename}`;
    
    console.log(`File saved successfully at ${publicPath}`);
    
    return NextResponse.json({
      success: true,
      filePath: publicPath
    });
    
  } catch (error: any) {
    console.error("Error saving edited video file:", error);
    return NextResponse.json(
      { error: "Failed to save file", details: error.message },
      { status: 500 }
    );
  }
} 