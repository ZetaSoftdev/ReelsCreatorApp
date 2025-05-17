import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { SocialPlatform } from "@prisma/client";

/**
 * GET: Fetch all connected social accounts for the current user
 */
export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      console.error("Unauthorized access attempt to social accounts API");
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    console.log(`Fetching social accounts for user: ${session.user.id}`);
    
    // Fetch accounts from database
    const accounts = await prisma.socialMediaAccount.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      select: {
        id: true,
        platform: true,
        accountName: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`Found ${accounts.length} active social accounts`);
    
    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("Error fetching social accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Add or update a social media account
 */
export async function POST(req: NextRequest) {
  try {
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      console.error("Unauthorized attempt to add social account");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const data = await req.json();
    const { platform, accountName, accessToken, refreshToken, tokenExpiry } = data;
    
    // Validate required fields
    if (!platform || !accountName || !accessToken) {
      console.error("Missing required fields for social account creation");
      return NextResponse.json(
        { error: "Missing required fields: platform, accountName, and accessToken are required" },
        { status: 400 }
      );
    }
    
    console.log(`Processing social account for platform: ${platform}, account: ${accountName}`);
    
    // Check if account already exists for this user and platform
    const existingAccount = await prisma.socialMediaAccount.findFirst({
      where: {
        userId: session.user.id,
        platform: platform as SocialPlatform,
        accountName
      }
    });
    
    if (existingAccount) {
      // Update existing account
      console.log(`Updating existing social account: ${existingAccount.id}`);
      const updatedAccount = await prisma.socialMediaAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: encrypt(accessToken),
          refreshToken: refreshToken ? encrypt(refreshToken) : null,
          tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
          isActive: true,
          updatedAt: new Date()
        },
        select: {
          id: true,
          platform: true,
          accountName: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      console.log(`Social account updated successfully: ${updatedAccount.id}`);
      
      return NextResponse.json({
        account: updatedAccount,
        message: "Account updated successfully"
      });
    }
    
    // Create new account
    console.log(`Creating new social account for platform: ${platform}`);
    const newAccount = await prisma.socialMediaAccount.create({
      data: {
        userId: session.user.id,
        platform: platform as SocialPlatform,
        accountName,
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
        isActive: true
      },
      select: {
        id: true,
        platform: true,
        accountName: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`New social account created successfully: ${newAccount.id}`);
    
    return NextResponse.json(
      {
        account: newAccount,
        message: "Account added successfully"
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding/updating social account:", error);
    return NextResponse.json(
      { error: "Failed to add account", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove (deactivate) a social media account
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      console.error("Unauthorized attempt to delete social account");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get account ID from query params
    const url = new URL(req.url);
    const accountId = url.searchParams.get("id");
    
    if (!accountId) {
      console.error("No account ID provided for deletion");
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`Attempting to delete social account: ${accountId}`);
    
    // Verify the account belongs to the user
    const account = await prisma.socialMediaAccount.findUnique({
      where: {
        id: accountId
      },
      select: {
        userId: true,
        platform: true,
        accountName: true
      }
    });
    
    if (!account) {
      console.error(`Account not found: ${accountId}`);
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }
    
    if (account.userId !== session.user.id) {
      console.error(`Unauthorized deletion attempt for account: ${accountId}`);
      return NextResponse.json(
        { error: "Access denied - you don't own this account" },
        { status: 403 }
      );
    }
    
    // Mark the account as inactive (soft delete)
    console.log(`Deactivating social account: ${accountId} (${account.platform}/${account.accountName})`);
    await prisma.socialMediaAccount.update({
      where: { id: accountId },
      data: {
        isActive: false
      }
    });
    
    console.log(`Social account deactivated successfully: ${accountId}`);
    
    return NextResponse.json({
      success: true,
      message: "Account removed successfully"
    });
  } catch (error: any) {
    console.error("Error deleting social account:", error);
    return NextResponse.json(
      { error: "Failed to delete account", details: error.message },
      { status: 500 }
    );
  }
} 