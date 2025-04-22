import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'

// Update user password
export async function PUT(request: Request) {
  try {
    console.log("PUT password API called");
    
    // Get the user's session
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log("Password update for user:", session.user.email);

    let data;
    try {
      // Parse the request body as text first
      const text = await request.text();
      console.log("Raw password request body:", text);
      
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Empty request body' },
          { status: 400 }
        )
      }
      
      // Then parse as JSON
      data = JSON.parse(text);
      console.log("Password request parsed successfully");
    } catch (parseError) {
      console.error('Error parsing JSON request:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request' },
        { status: 400 }
      )
    }
    
    // Special handling for social login users who may not have both fields
    const isSocialUser = session.user.id.startsWith('oauth_');
    
    // Validate required fields
    if (isSocialUser) {
      if (!data.newPassword) {
        return NextResponse.json(
          { error: 'New password is required' },
          { status: 400 }
        )
      }
    } else {
      // For regular users, require both fields
      if (!data.currentPassword || !data.newPassword) {
        return NextResponse.json(
          { error: 'Current password and new password are required' },
          { status: 400 }
        )
      }
    }

    // Get the user with their password
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id as string
      }
    })

    if (!user) {
      console.log("User not found:", session.user.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    console.log("User found, has password:", !!user.password);
    
    // Check if this is a social login user without a password
    const isFirstPasswordSet = !user.password || isSocialUser;
    
    if (isFirstPasswordSet) {
      // For Google/social users setting up a password for the first time
      // We'll set the password without requiring the old one
      console.log("Social login user setting first password");
      
      // Password complexity check
      if (data.newPassword.length < 8) {
        return NextResponse.json(
          { error: 'New password must be at least 8 characters long' },
          { status: 400 }
        )
      }

      try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(data.newPassword, 10)

        // Update the password in the database
        await prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        })

        console.log("Password set successfully for social user");
        
        // Return success response
        return NextResponse.json({
          success: true,
          message: 'Password set successfully'
        })
      } catch (error) {
        console.error("Error setting password:", error);
        return NextResponse.json(
          { error: 'Failed to set password' },
          { status: 500 }
        )
      }
    }

    // For normal users, verify current password
    try {
      console.log("Verifying password for regular user");
      // Ensure password is a string before comparing
      if (!user.password) {
        return NextResponse.json(
          { error: 'Password not set for this account' },
          { status: 400 }
        );
      }
      const passwordValid = await bcrypt.compare(data.currentPassword, user.password)
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }
    } catch (compareError) {
      console.error('Error comparing passwords:', compareError);
      return NextResponse.json(
        { error: 'Error verifying current password' },
        { status: 500 }
      )
    }

    // Password complexity check
    if (data.newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    try {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(data.newPassword, 10)

      // Update the password in the database
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      })

      console.log("Password updated successfully");
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      })
    } catch (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating password:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 