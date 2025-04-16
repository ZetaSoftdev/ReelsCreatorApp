import { prisma } from "./prisma";
import { Session } from "next-auth";
import { Role } from "./constants";

/**
 * Syncs user data between session and database
 * Ensures the database has the latest user info, especially useful for OAuth logins
 */
export async function syncUserData(session: Session | null) {
  if (!session?.user?.id) return null;
  
  try {
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
      }
    }).catch(() => null);
    
    if (!user) {
      // If user doesn't exist in database but exists in session (OAuth), try to create it
      if (session.user.email) {
        // Check if user exists with this email first
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true }
        }).catch(() => null);
        
        // If user already exists with this email, just return session data
        if (existingUserByEmail) {
          return {
            id: session.user.id,
            name: session.user.name || "",
            email: session.user.email,
            image: session.user.image,
            isSessionData: true
          };
        }
        
        // Try to create new user
        try {
          const newUser = await prisma.user.create({
            data: {
              id: session.user.id,
              name: session.user.name || "",
              email: session.user.email,
              profileImage: session.user.image || "",
              role: Role.USER, // Set default role
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          
          return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            image: newUser.profileImage,
            role: newUser.role,
          };
        } catch (error) {
          // Return session data as fallback
          return {
            id: session.user.id,
            name: session.user.name || "",
            email: session.user.email,
            image: session.user.image,
            isSessionData: true
          };
        }
      }
      return null;
    }
    
    // Check if session has data that should be updated in the database
    const isGoogleUser = session.user.id.startsWith('oauth_');
    const dbUpdateNeeded = (
      (session.user.name && session.user.name !== user.name) ||
      (!isGoogleUser && session.user.email && session.user.email !== user.email) ||
      (session.user.image && session.user.image !== user.profileImage)
    );
    
    if (dbUpdateNeeded) {
      try {
        // Update database with session data - but don't change email for Google users
        const updateData: Record<string, any> = {
          updatedAt: new Date()
        };
        
        if (session.user.name) {
          updateData.name = session.user.name;
        }
        
        if (!isGoogleUser && session.user.email) {
          updateData.email = session.user.email;
        }
        
        if (session.user.image) {
          updateData.profileImage = session.user.image;
        }
        
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true,
          }
        });
        
        return {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.profileImage,
          role: updatedUser.role,
        };
      } catch (error) {
        // If update fails, return the existing data
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.profileImage,
          role: user.role,
        };
      }
    }
    
    // Return existing user data
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.profileImage,
      role: user.role,
    };
  } catch (error) {
    // If all else fails, return session data
    if (session?.user) {
      return {
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image,
        isSessionData: true,
      };
    }
    
    return null;
  }
} 