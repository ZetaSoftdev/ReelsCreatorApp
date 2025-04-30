import NextAuth from 'next-auth'
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from './lib/constants';
import { User } from 'next-auth';

// Add a helper function for normalizing roles at the top of the file
const normalizeRole = (role: any): Role => {
  if (!role) return Role.USER;
  
  // Handle string values
  if (typeof role === 'string') {
    return role.toUpperCase() === 'ADMIN' ? Role.ADMIN : Role.USER;
  }
  
  // Handle enum values or objects
  return role === Role.ADMIN ? Role.ADMIN : Role.USER;
};

// Improved helper function to safely use Prisma with better error handling
const safePrismaOperation = async (operation: () => Promise<any>, fallback: any = null) => {
  // Always check if we're in a browser environment first
  if (typeof window !== 'undefined') {
    console.warn("Prisma operation attempted in browser environment, skipped");
    return fallback;
  }
  
  try {
    return await operation();
  } catch (error) {
    // Check specifically for browser environment errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("browser environment") || 
      errorMessage.includes("PrismaClient is unable to run")
    ) {
      console.warn("Prisma browser environment error caught:", errorMessage);
      return fallback;
    }
    
    console.error("Error in Prisma operation:", error);
    return fallback;
  }
};

export const { auth, handlers, signIn, signOut } = NextAuth({
    providers: [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }),
        CredentialsProvider({
          name: "Credentials",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials, request) {
            if (!credentials?.email || !credentials?.password) {
              return null;
            }

            try {
              if (typeof window !== 'undefined') {
                throw new Error("Cannot authenticate in browser environment");
              }
              
              const user = await prisma.user.findUnique({
                where: {
                  email: credentials.email as string
                }
              });

              if (!user || !user.password) {
                return null;
              }

              const passwordMatches = await bcrypt.compare(
                credentials.password as string, 
                user.password
              );

              if (!passwordMatches) {
                return null;
              }

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role as Role | undefined,
                image: user.profileImage
              };
            } catch (error) {
              console.error("Error during credential login:", error);
              return null;
            }
          }
        })
      ],
    trustHost: true,
    callbacks: {
      async signIn({ user, account }) {
        console.log("SignIn callback started for account:", account?.provider);
        
        // For credentials provider, we already verified in authorize
        if (account?.provider === "credentials") {
          console.log("Credentials provider - sign in successful");
          return true;
        }

        // Handle Google sign in
        if (account?.provider === "google" && user.email) {
          console.log("Google sign-in for email:", user.email);
          
          return await safePrismaOperation(async () => {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
              where: {
                email: user.email as string,
              },
              select: {
                id: true,
                email: true,
                role: true,
                profileImage: true
              }
            });

            console.log("Existing user check:", existingUser ? "Found" : "Not found");
            
            // If user doesn't exist, create a new one
            if (!existingUser) {
              console.log("Creating new user with default role USER");
              const newUser = await prisma.user.create({
                data: {
                  email: user.email as string,
                  name: user.name || "",
                  profileImage: user.image || "",
                  role: Role.USER, // Explicitly set role for new users
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
              });
              
              // IMPORTANT: Set the user ID to match the database ID
              console.log("Setting user ID from database:", newUser.id);
              user.id = newUser.id;
              
              // Add role to user object
              console.log("Setting new user role to:", Role.USER);
              user.role = Role.USER as any; // Cast to any to avoid type issues
              return true;
            }
            
            // IMPORTANT: For existing users, set the user ID to match the database ID
            console.log("Setting existing user ID from database:", existingUser.id);
            user.id = existingUser.id;
            
            // Add role with normalization to user object for Google authentication
            console.log("Setting existing user role from database:", existingUser.role);
            user.role = normalizeRole(existingUser.role);
            
            // Always update the user with the Google profile image if coming from Google auth
            if (user.image && !existingUser.profileImage) {
              // If user doesn't have a profile image, update it with the Google one
              console.log("Updating user profile image");
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { profileImage: user.image }
              });
            } else if (existingUser.profileImage) {
              // If user has a profile image in DB, use it
              user.image = existingUser.profileImage;
            }
            
            console.log("Google sign-in successful, user role:", user.role);
            return true;
          }, true);
        }

        return true;
      },
      async session({ session, token }) {
        console.log("Session callback - token:", token);
        
        if (session.user) {
          // Critical ID check and assignment
          if (!token.sub) {
            console.error("CRITICAL ERROR: token.sub is missing in session callback");
            console.error("This will cause authentication mismatch issues");
          }
          
          // Ensure ID is set - use token.sub as the canonical source, with type safety
          const userId = token.sub && typeof token.sub === 'string' 
            ? token.sub 
            : (token.id && typeof token.id === 'string' ? token.id : undefined);
            
          if (userId) {
            session.user.id = userId;
            console.log("Session - assigned user ID:", session.user.id);
          } else {
            console.error("CRITICAL ERROR: Could not find valid ID in token");
          }
          
          // Add normalized role from token to session
          console.log("Setting user role from token:", token.role);
          session.user.role = normalizeRole(token.role);
          console.log("User role set to:", session.user.role);
          
          // Get the latest user data from the database to ensure image and other data is fresh
          await safePrismaOperation(async () => {
            console.log("Fetching latest user data for ID:", token.sub);
            const userData = await prisma.user.findUnique({
              where: {
                id: token.sub
              },
              select: {
                profileImage: true,
                name: true,
                email: true,
                role: true  // Explicitly select role
              }
            });
            
            if (userData) {
              console.log("User data found:", {
                name: userData.name,
                email: userData.email,
                role: userData.role
              });
              
              // Update session with the latest data
              if (userData.profileImage) {
                session.user.image = userData.profileImage;
              }
              if (userData.name) {
                session.user.name = userData.name;
              }
              if (userData.email) {
                session.user.email = userData.email;
              }
              // Explicitly set normalized role from database if available
              if (userData.role) {
                console.log("Updating role from database:", userData.role);
                session.user.role = normalizeRole(userData.role);
              }
            } else {
              console.log("No user data found for ID:", token.sub);
            }
          });
        }
        
        console.log("Final session state:", {
          id: session.user?.id,
          email: session.user?.email,
          role: session.user?.role
        });
        
        return session;
      },
      async jwt({ token, user, trigger, session }) {
        if (user) {
          // CRITICAL FIX: Set both token.sub and token.id to user.id to ensure consistency
          // This ensures the token ID (used in session.user.id) matches our database ID
          token.sub = user.id;
          token.id = user.id;
          
          console.log("JWT callback - setting token IDs from user:", {
            userId: user.id,
            tokenSub: token.sub,
            tokenId: token.id
          });
          
          token.role = normalizeRole(user.role);
          
          // Add image to token if it exists
          if (user.image) {
            token.picture = user.image;
          }
        }
        
        // Handle token updates on session update
        if (trigger === "update" && session) {
          // Update token with the new data if provided
          if (session.user?.name) token.name = session.user.name;
          if (session.user?.email) token.email = session.user.email;
          if (session.user?.image) token.picture = session.user.image;
          
          // Also update the database if needed
          await safePrismaOperation(async () => {
            // Only include fields that are not null or undefined
            const updateData: Record<string, any> = {
              updatedAt: new Date()
            };
            
            if (session.user?.name) updateData.name = session.user.name;
            if (session.user?.email) updateData.email = session.user.email;
            if (session.user?.image) updateData.profileImage = session.user.image;
            
            await prisma.user.update({
              where: { id: token.sub as string },
              data: updateData
            });
          });
        }
        
        return token;
      }
    },
    pages: {
      signIn: '/login',
      error: '/unauthorized',
    },
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60, // 24 hours
    },
    debug: process.env.NODE_ENV === 'development',
})