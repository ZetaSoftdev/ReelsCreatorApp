import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@/lib/constants';

// Type assertion to avoid TypeScript errors with the new model
const prismaAny = prisma as any;

// Get settings
export async function GET() {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can access settings" },
        { status: 403 }
      );
    }

    // Get app settings
    let settings = await prismaAny.appSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prismaAny.appSettings.create({
        data: {} // Use schema defaults
      });
    }

    // Don't mask Stripe API keys so they appear properly in the UI
    // Only mask other sensitive data
    if (settings.smtpPassword) {
      settings.smtpPassword = '••••••••';
    }
    if (settings.s3SecretKey) {
      settings.s3SecretKey = '••••••••';
    }

    // Get branding settings
    const brandingSettings = await prismaAny.brandingSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // Combine settings
    const combinedSettings = {
      ...settings,
      branding: brandingSettings || {}
    };

    return NextResponse.json({
      success: true,
      settings: combinedSettings
    });

  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch settings", 
        details: error && error.message ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// Update settings
export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can update settings" },
        { status: 403 }
      );
    }

    // Parse the request body
    const data = await req.json();
    console.log('⚙️ Received settings update request');
    
    // Separate branding from other settings
    const { branding, ...appSettings } = data;

    // Update app settings, create if doesn't exist
    let existingSettings = await prismaAny.appSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // Log Stripe settings being received
    console.log('🔑 Stripe settings received:', {
      publishableKey: appSettings.stripe?.publishableKey ? 'PRESENT' : 'EMPTY',
      secretKey: appSettings.stripe?.secretKey ? 'PRESENT' : 'EMPTY',
      webhookSecret: appSettings.stripe?.webhookSecret ? 'PRESENT' : 'EMPTY',
      enableLiveMode: appSettings.stripe?.enableLiveMode
    });

    // Prepare the app settings data
    const appSettingsData = {
      // General settings
      userRegistration: appSettings.general?.userRegistration,
      maxUploadSize: appSettings.general?.maxUploadSize ? parseInt(appSettings.general.maxUploadSize) : undefined,
      defaultVideoQuality: appSettings.general?.defaultVideoQuality,
      defaultLanguage: appSettings.general?.defaultLanguage,
      enableEmailNotifications: appSettings.general?.enableEmailNotifications,
      maintenanceMode: appSettings.general?.maintenanceMode,
      
      // Email settings
      fromEmail: appSettings.email?.fromEmail,
      smtpHost: appSettings.email?.smtpHost,
      smtpPort: appSettings.email?.smtpPort,
      smtpUsername: appSettings.email?.smtpUsername,
      smtpPassword: appSettings.email?.smtpPassword === '••••••••' 
        ? undefined  // Don't update if masked
        : appSettings.email?.smtpPassword,
      enableSMTP: appSettings.email?.enableSMTP,
      
      // Subscription settings
      trialPeriod: appSettings.subscription?.trialPeriod ? parseInt(appSettings.subscription.trialPeriod) : undefined,
      defaultPlan: appSettings.subscription?.defaultPlan,
      enableRecurring: appSettings.subscription?.enableRecurring,
      gracePeriod: appSettings.subscription?.gracePeriod ? parseInt(appSettings.subscription.gracePeriod) : undefined,
      allowCancellation: appSettings.subscription?.allowCancellation,
      
      // Stripe settings
      stripePublishableKey: appSettings.stripe?.publishableKey,
      stripeSecretKey: appSettings.stripe?.secretKey,
      stripeWebhookSecret: appSettings.stripe?.webhookSecret,
      stripeLiveMode: appSettings.stripe?.enableLiveMode,
      
      // Privacy settings
      privacyPolicy: appSettings.privacy?.privacyPolicy,
      termsOfService: appSettings.privacy?.termsOfService,
      cookiePolicy: appSettings.privacy?.cookiePolicy,
      dataRetentionDays: appSettings.privacy?.dataRetentionDays ? parseInt(appSettings.privacy.dataRetentionDays) : undefined,
      allowDataExport: appSettings.privacy?.allowDataExport,
      
      // Storage settings
      storageProvider: appSettings.storage?.provider,
      s3BucketName: appSettings.storage?.s3BucketName,
      s3AccessKey: appSettings.storage?.s3AccessKey,
      s3SecretKey: appSettings.storage?.s3SecretKey === '••••••••' 
        ? undefined 
        : appSettings.storage?.s3SecretKey,
      s3Region: appSettings.storage?.s3Region,
      maxStorageGB: appSettings.storage?.maxStorageGB ? parseInt(appSettings.storage.maxStorageGB) : undefined,
    };
    
    // Log Stripe settings being saved
    console.log('💾 Stripe settings being saved:', {
      stripePublishableKey: appSettingsData.stripePublishableKey ? 'PRESENT' : 'EMPTY',  
      stripeSecretKey: appSettingsData.stripeSecretKey ? 'PRESENT' : 'EMPTY',
      stripeWebhookSecret: appSettingsData.stripeWebhookSecret ? 'PRESENT' : 'EMPTY',
      stripeLiveMode: appSettingsData.stripeLiveMode
    });
    
    // Filter out undefined values
    const filteredAppSettingsData = Object.fromEntries(
      Object.entries(appSettingsData).filter(([_, v]) => v !== undefined)
    );

    // Update or create app settings
    let updatedAppSettings;
    if (existingSettings) {
      console.log('✏️ Updating existing settings record:', existingSettings.id);
      updatedAppSettings = await prismaAny.appSettings.update({
        where: { id: existingSettings.id },
        data: filteredAppSettingsData
      });
    } else {
      console.log('🆕 Creating new settings record');
      updatedAppSettings = await prismaAny.appSettings.create({
        data: filteredAppSettingsData as any
      });
    }

    console.log('✅ Settings updated successfully');

    // Only mask non-Stripe sensitive data in response
    if (updatedAppSettings.smtpPassword) {
      updatedAppSettings.smtpPassword = '••••••••';
    }
    if (updatedAppSettings.s3SecretKey) {
      updatedAppSettings.s3SecretKey = '••••••••';
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedAppSettings
    });

  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { 
        error: "Failed to update settings", 
        details: error && error.message ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 