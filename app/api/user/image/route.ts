import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'

// POST endpoint to handle image uploads
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, GIF and WebP are allowed' },
        { status: 400 }
      )
    }

    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 1MB' },
        { status: 400 }
      )
    }

    // Create a unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate unique filename with original extension
    const originalExtension = path.extname(file.name)
    const filename = `${uuidv4()}${originalExtension}`
    
    // Define the upload directory and path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')
    const filePath = path.join(uploadDir, filename)
    
    // Ensure the upload directory exists
    try {
      await fs.mkdir(uploadDir, { recursive: true })
    } catch (err) {
      console.error('Error creating directory:', err)
    }
    
    // Save the file
    try {
      await writeFile(filePath, buffer)
    } catch (err) {
      console.error('Error writing file:', err)
      return NextResponse.json(
        { error: 'Failed to save image' },
        { status: 500 }
      )
    }

    // Create the public URL
    const publicUrl = `/uploads/profiles/${filename}`
    
    // First check if user exists in database
    const userExists = await prisma.user.findUnique({
      where: {
        id: session.user.id
      }
    }).catch(() => null);
    
    // If user doesn't exist yet (Google login case), create it first
    if (!userExists) {
      try {
        await prisma.user.create({
          data: {
            id: session.user.id,
            name: session.user.name || '',
            email: session.user.email || '',
            profileImage: publicUrl,
            role: 'USER',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      } catch (createError) {
        console.error('Error creating user:', createError);
        // Continue anyway as the image was saved, just might not update DB
      }
    }
    
    try {
      // Update the user's profile image in the database
      const updatedUser = await prisma.user.update({
        where: {
          id: session.user.id
        },
        data: {
          profileImage: publicUrl,
          updatedAt: new Date()
        }
      });
      
      // Return success with the image URL
      return NextResponse.json({
        success: true,
        imageUrl: publicUrl,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.profileImage,
        }
      });
    } catch (dbError) {
      console.error('Database error while updating profile image:', dbError);
      // Still return success as the file was saved
      return NextResponse.json({
        success: true,
        imageUrl: publicUrl,
        user: {
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          image: publicUrl
        },
        warning: 'Image saved but database could not be updated'
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error uploading image:', errorMessage);
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
} 