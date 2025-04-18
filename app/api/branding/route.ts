import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { Role } from "@/lib/constants";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// Create a global variable for PrismaClient to enable connection reuse
let prisma: PrismaClient;

// Initialize PrismaClient lazily to avoid multiple instances in development
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Default branding settings
const defaultBranding = {
  siteName: "Reels Creator",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  primaryColor: "#7c3aed",
  accentColor: "#eab308",
  defaultFont: "Poppins",
};

// Path for storing branding settings in a file
const brandingFilePath = path.join(process.cwd(), "data", "branding.json");

// Helper function to ensure the directory exists
function ensureDirectoryExists(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

// Helper function to save uploaded file to disk
async function saveFileToDisk(
  file: File,
  directory: string
): Promise<string | null> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    ensureDirectoryExists(directory);

    // Generate unique filename
    const uniqueFilename = `${uuidv4()}-${file.name}`;
    const filePath = path.join(directory, uniqueFilename);
    
    fs.writeFileSync(filePath, buffer);
    
    // Return the public URL to access the file
    const publicPath = filePath.split("public")[1].replace(/\\/g, "/");
    console.log("Saved file to:", filePath);
    console.log("Public path:", publicPath);
    
    return publicPath;
  } catch (error) {
    console.error("Error saving file:", error);
    return null;
  }
}

// Helper function to read settings from file
function readSettingsFromFile(): any {
  try {
    if (fs.existsSync(brandingFilePath)) {
      const fileContent = fs.readFileSync(brandingFilePath, "utf8");
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error reading branding settings file:", error);
  }
  
  return null;
}

// Helper function to write settings to file
function writeSettingsToFile(settings: any): boolean {
  try {
    ensureDirectoryExists(brandingFilePath);
    fs.writeFileSync(brandingFilePath, JSON.stringify(settings, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing branding settings file:", error);
    return false;
  }
}

// Helper to ensure branding settings exist (either in DB or file)
async function ensureBrandingSettings() {
  try {
    const prismaClient = getPrismaClient();
    
    // Try to get settings from database
    let settings = await prismaClient.brandingSettings.findFirst();
    
    if (!settings) {
      console.log("No branding settings found in database, checking file...");
      
      // Try to get settings from file
      const fileSettings = readSettingsFromFile();
      
      if (fileSettings) {
        console.log("Found branding settings in file");
        
        // Try to save file settings to database
        try {
          settings = await prismaClient.brandingSettings.create({
            data: fileSettings,
          });
          console.log("Migrated file settings to database");
        } catch (dbError) {
          console.error("Error migrating settings to database:", dbError);
          // Return file settings if DB save fails
          return fileSettings;
        }
      } else {
        console.log("No branding settings found in file, creating defaults");
        
        // Try to create default settings in database
        try {
          settings = await prismaClient.brandingSettings.create({
            data: defaultBranding,
          });
          console.log("Created default branding settings in database");
        } catch (dbError) {
          console.error("Error creating default settings in database:", dbError);
          
          // If database fails, save defaults to file
          if (writeSettingsToFile(defaultBranding)) {
            console.log("Saved default branding settings to file");
          }
          
          // Return default settings
          return defaultBranding;
        }
      }
    }
    
    return settings;
  } catch (error) {
    console.error("Error ensuring branding settings:", error);
    
    // Last resort: return default settings
    return defaultBranding;
  }
}

// GET endpoint to fetch branding settings
export async function GET() {
  try {
    console.log("GET /api/branding - Fetching branding settings");
    
    const prismaClient = getPrismaClient();
    
    try {
      // Try to get settings from database
      let settings = await prismaClient.brandingSettings.findFirst();
      
      if (!settings) {
        console.log("No branding settings found in database, falling back to file or defaults");
        
        // Ensure branding settings exist somewhere
        settings = await ensureBrandingSettings();
      }
      
      return NextResponse.json(settings);
    } catch (dbError) {
      console.error("Database error when fetching branding settings:", dbError);
      
      // Try fallback to file
      const fileSettings = readSettingsFromFile();
      
      if (fileSettings) {
        return NextResponse.json(fileSettings);
      }
      
      // Last resort: return default settings
      return NextResponse.json(defaultBranding);
    }
  } catch (error) {
    console.error("Error in GET /api/branding:", error);
    return NextResponse.json(defaultBranding);
  }
}

// POST endpoint to update branding settings
export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/branding - Updating branding settings");
    
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
    
    // Parse form data
    const formData = await req.formData();
    
    // Extract form values
    const siteName = formData.get("siteName") as string;
    const primaryColor = formData.get("primaryColor") as string;
    const accentColor = formData.get("accentColor") as string;
    const defaultFont = formData.get("defaultFont") as string;
    const logoFile = formData.get("logo") as File || null;
    const faviconFile = formData.get("favicon") as File || null;
    
    console.log("Received form data:", {
      siteName,
      primaryColor,
      accentColor,
      defaultFont,
      logoFile: logoFile ? logoFile.name : null,
      faviconFile: faviconFile ? faviconFile.name : null,
    });
    
    // Get existing settings
    let existingSettings;
    let usingFileStorage = false;
    
    const prismaClient = getPrismaClient();
    
    try {
      existingSettings = await prismaClient.brandingSettings.findFirst();
    } catch (dbError) {
      console.error("Database error when fetching existing settings:", dbError);
      
      // Try fallback to file
      existingSettings = readSettingsFromFile();
      usingFileStorage = true;
      
      if (!existingSettings) {
        existingSettings = defaultBranding;
      }
    }
    
    // Prepare updated settings object
    const updatedSettings = {
      ...(existingSettings || defaultBranding),
      siteName: siteName || existingSettings?.siteName || defaultBranding.siteName,
      primaryColor: primaryColor || existingSettings?.primaryColor || defaultBranding.primaryColor,
      accentColor: accentColor || existingSettings?.accentColor || defaultBranding.accentColor,
      defaultFont: defaultFont || existingSettings?.defaultFont || defaultBranding.defaultFont,
    };
    
    // Handle logo upload
    if (logoFile) {
      console.log("Processing logo file:", logoFile.name);
      const logoPath = await saveFileToDisk(
        logoFile,
        path.join(process.cwd(), "public", "uploads", "branding")
      );
      
      if (logoPath) {
        updatedSettings.logoUrl = logoPath;
      }
    }
    
    // Handle favicon upload
    if (faviconFile) {
      console.log("Processing favicon file:", faviconFile.name);
      const faviconPath = await saveFileToDisk(
        faviconFile,
        path.join(process.cwd(), "public", "uploads", "branding")
      );
      
      if (faviconPath) {
        updatedSettings.faviconUrl = faviconPath;
      }
    }
    
    // Save updated settings
    if (usingFileStorage) {
      console.log("Using file storage for branding settings");
      
      // Save to file
      if (writeSettingsToFile(updatedSettings)) {
        console.log("Successfully updated branding settings in file");
        
        // Try to sync to database anyway
        try {
          if (existingSettings && existingSettings.id) {
            await prismaClient.brandingSettings.update({
              where: { id: existingSettings.id },
              data: updatedSettings,
            });
            console.log("Successfully synced file settings to database");
          } else {
            await prismaClient.brandingSettings.create({
              data: updatedSettings,
            });
            console.log("Successfully created branding settings in database from file");
          }
        } catch (syncError) {
          console.error("Error syncing file settings to database:", syncError);
          // Continue with file storage approach
        }
        
        return NextResponse.json(updatedSettings);
      } else {
        return new NextResponse(
          JSON.stringify({ error: "Failed to update settings file" }),
          { status: 500 }
        );
      }
    } else {
      console.log("Using database storage for branding settings");
      
      try {
        // Save to database
        let result;
        
        if (existingSettings && existingSettings.id) {
          // Update existing settings
          result = await prismaClient.brandingSettings.update({
            where: { id: existingSettings.id },
            data: updatedSettings,
          });
          
          console.log("Successfully updated branding settings in database");
        } else {
          // Create new settings
          result = await prismaClient.brandingSettings.create({
            data: updatedSettings,
          });
          
          console.log("Successfully created branding settings in database");
        }
        
        // Backup to file as well
        writeSettingsToFile(result);
        
        return NextResponse.json(result);
      } catch (dbError) {
        console.error("Database error when saving settings:", dbError);
        
        // Fallback to file storage
        if (writeSettingsToFile(updatedSettings)) {
          console.log("Fallback: Successfully saved settings to file");
          return NextResponse.json(updatedSettings);
        } else {
          return new NextResponse(
            JSON.stringify({ error: "Failed to save settings to database or file" }),
            { status: 500 }
          );
        }
      }
    }
  } catch (error) {
    console.error("Error in POST /api/branding:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 