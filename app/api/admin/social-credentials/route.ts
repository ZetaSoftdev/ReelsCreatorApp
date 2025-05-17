import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

/**
 * GET: Get current OAuth credentials from AppSettings
 */
export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== Role.ADMIN) {
      console.error("Unauthorized attempt to access social credentials");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the AppSettings
    const settings = await prisma.appSettings.findFirst();
    
    if (!settings) {
      return NextResponse.json({ error: "No app settings found" }, { status: 404 });
    }
    
    // Return the OAuth credentials (but mask secrets)
    const socialCredentials = {
      youtube: {
        clientId: settings.youtubeClientId || '',
        clientSecret: settings.youtubeClientSecret ? '•••••••••••••••••' : '',
      },
      tiktok: {
        clientId: settings.tiktokClientId || '',
        clientSecret: settings.tiktokClientSecret ? '•••••••••••••••••' : '',
      },
      instagram: {
        clientId: settings.instagramClientId || '',
        clientSecret: settings.instagramClientSecret ? '•••••••••••••••••' : '',
      },
      facebook: {
        clientId: settings.facebookClientId || '',
        clientSecret: settings.facebookClientSecret ? '•••••••••••••••••' : '',
      },
      twitter: {
        clientId: settings.twitterClientId || '',
        clientSecret: settings.twitterClientSecret ? '•••••••••••••••••' : '',
      }
    };
    
    return NextResponse.json({ socialCredentials });
  } catch (error: any) {
    console.error("Error fetching social credentials:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Save OAuth credentials to AppSettings
 */
export async function POST(req: NextRequest) {
  try {
    // Get the user session
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== Role.ADMIN) {
      console.error("Unauthorized attempt to update social credentials");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the request body
    const data = await req.json();
    
    // Get the current settings or create if not exists
    let settings = await prisma.appSettings.findFirst();
    
    if (!settings) {
      // Create default settings
      settings = await prisma.appSettings.create({
        data: {
          userRegistration: true,
          maxUploadSize: 500,
          defaultVideoQuality: '720p',
          defaultLanguage: 'en',
          enableEmailNotifications: true,
          maintenanceMode: false,
          fromEmail: 'noreply@reelscreator.com',
          enableSMTP: false,
          trialPeriod: 14,
          defaultPlan: 'basic',
          enableRecurring: true,
          gracePeriod: 3,
          allowCancellation: true,
          stripeLiveMode: false,
          dataRetentionDays: 90,
          allowDataExport: true,
          storageProvider: 'local',
          maxStorageGB: 50
        }
      });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Check which platform is being updated
    if (data.platform && data.clientId !== undefined) {
      const platform = data.platform.toLowerCase();
      const clientIdKey = `${platform}ClientId`;
      const clientSecretKey = `${platform}ClientSecret`;
      
      // Update client ID if provided
      updateData[clientIdKey] = data.clientId || null;
      
      // Update client secret if provided (and not the masked value)
      if (data.clientSecret && data.clientSecret !== '•••••••••••••••••') {
        updateData[clientSecretKey] = data.clientSecret;
      }
      
      // Update the settings
      await prisma.appSettings.update({
        where: { id: settings.id },
        data: updateData
      });
      
      return NextResponse.json({
        success: true,
        message: `${data.platform} credentials updated successfully`
      });
    } else {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error updating social credentials:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 