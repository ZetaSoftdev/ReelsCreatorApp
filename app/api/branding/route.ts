import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { mkdir, access, constants } from 'fs/promises';
import path from 'path';
import fs from 'fs/promises';
import { auth } from "@/auth";
import { Role } from '@/lib/constants';

// Define default branding settings
const defaultBranding = {
  siteName: "Editur",
  logoUrl: "/branding/logo.png",
  faviconUrl: "/branding/favicon.png",
  primaryColor: "#8B5CF6",
  accentColor: "#F59E0B",
  defaultFont: "Poppins"
};

// Path to store settings in JSON file as fallback
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'branding-settings.json');

// Helper function to ensure directory exists
async function ensureDirectoryExists(directory: string) {
  try {
    await access(directory, constants.F_OK);
  } catch (error) {
    await mkdir(directory, { recursive: true });
  }
}

// Helper function to save file to disk
async function saveFileToDisk(file: File, directory: string, filename: string): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Ensure the directory exists
    await ensureDirectoryExists(directory);
    
    // Create full file path
    const filepath = path.join(directory, filename);
    
    // Write the file
    await writeFile(filepath, buffer);
    
    console.log(`File saved successfully to: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error('Error saving file to disk:', error);
    throw new Error('Failed to save file to disk');
  }
}

// Helper to read settings from a JSON file
async function readSettingsFromFile() {
  try {
    await ensureDirectoryExists(path.dirname(SETTINGS_FILE_PATH));
    const data = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return default settings
    return defaultBranding;
  }
}

// Helper to write settings to a JSON file
async function writeSettingsToFile(settings: any) {
  try {
    await ensureDirectoryExists(path.dirname(SETTINGS_FILE_PATH));
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing settings to file:', error);
    return false;
  }
}

// Function to ensure branding settings exist in database
async function ensureBrandingSettings() {
  console.log('Ensuring branding settings exist in database');
  try {
    // Check if branding settings exist
    const existingSettings = await prisma.brandingSettings.findFirst();
    
    if (!existingSettings) {
      console.log('No branding settings found, creating default');
      try {
        await prisma.brandingSettings.create({
          data: {
            siteName: "Editur",
            logoUrl: "/branding/logo.png",
            faviconUrl: "/branding/favicon.png",
            primaryColor: "#8B5CF6",
            accentColor: "#F59E0B",
            defaultFont: "Poppins"
          }
        });
        console.log('Default branding settings created');
      } catch (error) {
        console.error('Error creating default branding settings:', error);
        // Fallback to file storage
        await writeSettingsToFile({
          siteName: "Editur",
          logoUrl: "/branding/logo.png",
          faviconUrl: "/branding/favicon.png",
          primaryColor: "#8B5CF6",
          accentColor: "#F59E0B",
          defaultFont: "Poppins"
        });
      }
    } else {
      console.log('Existing branding settings found:', existingSettings.id);
    }
  } catch (error) {
    console.error('Error checking branding settings:', error);
    // Fallback to file storage if Prisma fails
    await writeSettingsToFile(defaultBranding);
  }
}

// GET endpoint to fetch branding settings
export async function GET() {
  try {
    // Ensure branding settings exist
    await ensureBrandingSettings();
    
    // Get branding settings from the database
    let branding = null;
    
    try {
      branding = await prisma.brandingSettings.findFirst();
    } catch (error) {
      console.error('Error accessing branding settings from database:', error);
      // Attempt to read from file storage as fallback
      branding = await readSettingsFromFile();
    }
    
    // If no branding settings exist, return default values
    if (!branding) {
      return NextResponse.json(defaultBranding);
    }
    
    // Return the branding settings
    return NextResponse.json(branding);
  } catch (error) {
    console.error("Error fetching branding settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch branding settings" },
      { status: 500 }
    );
  }
}

// POST endpoint to update branding settings
export async function POST(request: Request) {
  try {
    console.log('Processing branding update request');
    
    // Check authentication and authorization
    const session = await auth();
    console.log('Session data:', JSON.stringify({
      authenticated: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    }));
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // If the user already has ADMIN role in the session, we can skip the database check
    if (session.user.role === Role.ADMIN) {
      console.log('User is already authenticated as admin in session');
    } else {
      console.log('User role in session is not admin, checking database...');
      
      // Get user from database to check role
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      
      console.log('User from database:', JSON.stringify({
        id: user?.id,
        email: user?.email,
        role: user?.role, 
        roleType: typeof user?.role
      }));
      
      // Make sure user is an admin - debug the actual value comparison
      if (!user) {
        console.log('User not found in database');
        return NextResponse.json(
          { error: "Forbidden: User not found" },
          { status: 403 }
        );
      }
      
      // Check if role is admin using a more robust comparison
      const roleStr = String(user.role);
      const isAdmin = roleStr === Role.ADMIN || roleStr === 'ADMIN';
      
      console.log(`Role check details:`, {
        userRoleActual: roleStr,
        roleEnumAdmin: Role.ADMIN,
        comparisonResult: isAdmin
      });
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 }
        );
      }
    }
    
    // Ensure directory exists first
    const brandingDirectory = path.join(process.cwd(), 'public', 'branding');
    await ensureDirectoryExists(brandingDirectory);
    console.log('Ensured branding directory exists:', brandingDirectory);
    
    const formData = await request.formData();
    
    // Log received form data
    console.log('Received form fields:', Array.from(formData.keys()));
    
    const siteName = formData.get('siteName') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const accentColor = formData.get('accentColor') as string;
    const defaultFont = formData.get('defaultFont') as string;
    
    console.log('Text fields:', { siteName, primaryColor, accentColor, defaultFont });
    
    const logoFile = formData.get('logo') as File | null;
    const faviconFile = formData.get('favicon') as File | null;
    
    if (logoFile) {
      console.log('Logo file received:', logoFile.name, logoFile.size, 'bytes');
    }
    
    if (faviconFile) {
      console.log('Favicon file received:', faviconFile.name, faviconFile.size, 'bytes');
    }
    
    // First, ensure branding settings exist
    await ensureBrandingSettings();
    
    // Try to use Prisma first
    let brandingSettings;
    let brandingId;
    let usePrisma = false;
    
    try {
      const existingSettings = await prisma.brandingSettings.findFirst();
      if (existingSettings) {
        usePrisma = true;
        brandingSettings = existingSettings;
        brandingId = existingSettings.id;
        console.log('Found existing branding settings with ID:', brandingId);
      }
    } catch (error) {
      console.error('Error accessing Prisma model, using file storage:', error);
      brandingSettings = await readSettingsFromFile();
    }

    const updateData: any = {
      siteName,
      primaryColor,
      accentColor,
      defaultFont
    };
    
    // Process logo if provided
    if (logoFile && logoFile.size > 0) {
      try {
        const fileExtension = logoFile.name.split('.').pop();
        const logoFilename = `logo_${Date.now()}.${fileExtension}`;
        
        // Save file to disk
        const logoPath = await saveFileToDisk(logoFile, brandingDirectory, logoFilename);
        
        // Update with new logo info
        updateData.logoUrl = `/branding/${logoFilename}`;
        updateData.logoPath = logoPath;
        
        console.log(`Logo saved: ${logoPath}`);
      } catch (error) {
        console.error('Error processing logo file:', error);
      }
    } else if (brandingSettings?.logoUrl) {
      // Keep existing logo if present
      updateData.logoUrl = brandingSettings.logoUrl;
      updateData.logoPath = brandingSettings.logoPath;
    }
    
    // Process favicon if provided
    if (faviconFile && faviconFile.size > 0) {
      try {
        const fileExtension = faviconFile.name.split('.').pop();
        const faviconFilename = `favicon_${Date.now()}.${fileExtension}`;
        
        // Save file to disk
        const faviconPath = await saveFileToDisk(faviconFile, brandingDirectory, faviconFilename);
        
        // Update with new favicon info
        updateData.faviconUrl = `/branding/${faviconFilename}`;
        updateData.faviconPath = faviconPath;
        
        console.log(`Favicon saved: ${faviconPath}`);
      } catch (error) {
        console.error('Error processing favicon file:', error);
      }
    } else if (brandingSettings?.faviconUrl) {
      // Keep existing favicon if present
      updateData.faviconUrl = brandingSettings.faviconUrl;
      updateData.faviconPath = brandingSettings.faviconPath;
    }
    
    console.log('Final update data:', updateData);
    
    // Update or create settings
    if (usePrisma) {
      try {
        if (brandingId) {
          brandingSettings = await prisma.brandingSettings.update({
            where: { id: brandingId },
            data: updateData
          });
          console.log('Updated existing branding settings');
        } else {
          brandingSettings = await prisma.brandingSettings.create({
            data: updateData
          });
          console.log('Created new branding settings');
        }
      } catch (error) {
        console.error('Error updating with Prisma, falling back to file storage:', error);
        usePrisma = false;
      }
    }
    
    // If Prisma failed or isn't available, use file storage
    if (!usePrisma) {
      brandingSettings = { ...updateData };
      const writeResult = await writeSettingsToFile(brandingSettings);
      console.log('Wrote settings to file, result:', writeResult);
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: "Branding settings updated successfully",
      data: brandingSettings
    });
  } catch (error) {
    console.error("Error updating branding settings:", error);
    return NextResponse.json(
      { error: "Failed to update branding settings", details: (error as Error).message },
      { status: 500 }
    );
  }
} 