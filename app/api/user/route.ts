import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { syncUserData } from '@/lib/sync-user-session'
import { Role } from '@/lib/constants'

// GET user details
export async function GET() {
  try {
    // Get the user's session
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log("GET user API called for:", session.user.email);

    // Sync user data between session and database
    const userData = await syncUserData(session);
    
    if (!userData) {
      // If sync failed, try to return basic session data as fallback
      if (session.user.email) {
        return NextResponse.json({
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email,
          image: session.user.image,
          isSessionData: true
        })
      }
      
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return the synced user data
    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user details
export async function PUT(request: Request) {
  try {
    // Get the user's session
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log("PUT API called for user:", session.user.id, session.user.email);
    
    let data;
    try {
      // Parse the request body as JSON directly
      data = await request.json();
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }
    
    console.log("Received update data:", data);
    
    // Make sure there's at least one field to update
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 }
      )
    }
    
    // Check if this is a Google user - more reliable detection
    // Fetch user from database first to check
    let existingUser = await prisma.user.findUnique({
      where: {
        email: session.user.email || ''
      }
    }).catch(() => null);
    
    // Consider a user to be a Google/OAuth user if they don't exist in the database yet
    // or if their ID is different from the session ID (indicating OAuth)
    const isGoogleUser = !existingUser || 
                          (existingUser && session.user.email?.includes('gmail.com'));
    
    console.log("Is Google user?", isGoogleUser);
    
    // For Google users, remove email from update data to prevent conflicts
    if (isGoogleUser && data.email) {
      console.log("Removing email field for Google user");
      delete data.email;
    }
    
    // Validate input data
    if (data.name !== undefined && typeof data.name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid name format' },
        { status: 400 }
      )
    }

    if (data.email !== undefined && (typeof data.email !== 'string' || !data.email.includes('@'))) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Try to find the user by ID as a fallback
    if (!existingUser) {
      console.log("Looking for user in database with id:", session.user.id);
      existingUser = await prisma.user.findUnique({
        where: {
          id: session.user.id
        }
      }).catch(err => {
        console.error("Error finding user:", err);
        return null;
      });
    }
    
    console.log("User found?", !!existingUser);
    
    // If Google user doesn't exist in DB yet, create them
    if (!existingUser && session.user.email) {
      console.log("Creating new user in database");
      try {
        const newUser = await prisma.user.create({
          data: {
            id: session.user.id,
            name: data.name || session.user.name || '',
            email: session.user.email || '',
            profileImage: session.user.image || '',
            role: 'USER',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log("Successfully created new user:", newUser.id);
        
        // Return the created user
        return NextResponse.json({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          image: newUser.profileImage,
          updated: true,
          created: true
        });
      } catch (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: 'Failed to create user in database' },
          { status: 500 }
        );
      }
    }
    
    // If user doesn't exist and we couldn't create them, return error
    if (!existingUser) {
      console.error("User not found in database and couldn't be created:", session.user.id);
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };
    
    if (data.name !== undefined) {
      updateData.name = data.name === '' ? null : data.name;
      console.log("Adding name to update:", updateData.name);
    }
    
    if (!isGoogleUser && data.email !== undefined) {
      updateData.email = data.email === '' ? null : data.email;
      console.log("Adding email to update:", updateData.email);
    }
    
    // Only update if there are fields to update other than updatedAt
    if (Object.keys(updateData).length <= 1) {
      console.log("No fields to update");
      // Just updatedAt was included, no real changes
      return NextResponse.json({
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        image: existingUser.profileImage,
        updated: false
      });
    }

    try {
      console.log("Updating user with data:", updateData);
      // Update the user in the database
      const updatedUser = await prisma.user.update({
        where: {
          id: existingUser.id
        },
        data: updateData
      });

      console.log("User updated successfully");
      // Return the updated user data
      return NextResponse.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.profileImage,
        updated: true
      });
    } catch (updateError) {
      console.error('Error updating user:', updateError);
      
      // Handle Prisma errors (like unique constraint violations)
      if (updateError instanceof Prisma.PrismaClientKnownRequestError) {
        if (updateError.code === 'P2002') {
          return NextResponse.json(
            { error: 'This email is already in use' },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: `Database error: ${updateError.message}` },
          { status: 500 }
        );
      }
      
      // For other types of errors
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }
  } catch (error) {
    // Final catch-all error handler
    console.error('Error in user update API:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 