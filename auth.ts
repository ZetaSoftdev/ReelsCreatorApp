import NextAuth from 'next-auth'
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from './lib/constants';
import { User } from 'next-auth';

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
        // For credentials provider, we already verified in authorize
        if (account?.provider === "credentials") {
          return true;
        }

        // Handle Google sign in
        if (account?.provider === "google" && user.email) {
          return await safePrismaOperation(async () => {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
              where: {
                email: user.email as string,
              },
            });

            // If user doesn't exist, create a new one
            if (!existingUser) {
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
              
              // Add role to user object
              user.role = Role.USER as any;
              return true;
            }
            
            // Add role and profile image to user object for Google authentication
            user.role = existingUser.role as any;
            
            // Always update the user with the Google profile image if coming from Google auth
            if (user.image && !existingUser.profileImage) {
              // If user doesn't have a profile image, update it with the Google one
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { profileImage: user.image }
              });
            } else if (existingUser.profileImage) {
              // If user has a profile image in DB, use it
              user.image = existingUser.profileImage;
            }
            
            return true;
          }, true);
        }

        return true;
      },
      async session({ session, token }) {
        if (session.user && token.sub) {
          // Ensure ID is set
          session.user.id = token.sub;
          
          // Add role from token to session with fallback to USER
          session.user.role = (token.role as Role) || Role.USER;
          
          // Get the latest user data from the database to ensure image and other data is fresh
          await safePrismaOperation(async () => {
            const userData = await prisma.user.findUnique({
              where: {
                id: token.sub
              },
              select: {
                profileImage: true,
                name: true,
                email: true
              }
            });
            
            if (userData) {
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
            }
          });
        }
        return session;
      },
      async jwt({ token, user, trigger, session }) {
        if (user) {
          // Add ID and role to token
          token.id = user.id;
          token.role = user.role || Role.USER;
          
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