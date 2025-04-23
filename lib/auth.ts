"use server"

import { signIn, signOut } from "@/auth"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { Role } from "./constants"

export const login = async () => {
    await signIn("google", { redirectTo: "/dashboard/home" })
}

export const loginOut = async () => {
    // Add a unique timestamp to prevent caching and ensure a fresh page load
    const timestamp = Date.now()
    
    // We use the redirectTo to completely reload the page
    // Client-side code will handle clearing localStorage
    await signOut({ 
        redirectTo: `/login?logout=true&ts=${timestamp}`
    })
}

export const loginWithCredentials = async (email: string, password: string) => {
    try {
        console.log(`Attempting login for email: ${email}`);
        
        // First check if the user exists
        const userExists = await prisma.user.findUnique({
            where: { email },
            select: { id: true, password: true }
        });
        
        if (!userExists) {
            console.log(`User not found for email: ${email}`);
            return { success: false, error: "Email not registered" };
        }
        
        if (!userExists.password) {
            console.log(`User has no password set, might be social login only: ${email}`);
            return { success: false, error: "This account requires social login" };
        }
        
        // Try signing in with credentials
        try {
            console.log("Calling NextAuth signIn with credentials");
            await signIn("credentials", {
                email,
                password,
                redirect: false
            });
            
            console.log("Credential sign in successful");
            
            // Get user data after successful login
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                }
            });
            
            if (!user) {
                console.error("User not found after successful login - this should not happen");
                return { success: false, error: "User not found after login" };
            }
            
            // Normalize the role value to handle production type issues
            let normalizedRole = Role.USER;
            if (user.role) {
                if (typeof user.role === 'string') {
                    normalizedRole = user.role.toUpperCase() === 'ADMIN' ? Role.ADMIN : Role.USER;
                } else {
                    normalizedRole = user.role;
                }
            }
            
            console.log(`User found with normalized role: ${normalizedRole}`);
            
            // Create a safe user object with only the data we need
            const safeUser = {
                id: user.id,
                email: user.email,
                name: user.name || "",
                role: normalizedRole
            };
            
            return { 
                success: true, 
                user: safeUser
            };
        } catch (signInError) {
            console.error("Error during NextAuth signIn:", signInError);
            return { success: false, error: "Invalid password" };
        }
    } catch (error) {
        console.error("General error during credential login:", error);
        
        // Check for common database connection errors
        if (error instanceof Error && error.message) {
            if (
                error.message.includes("connection") || 
                error.message.includes("database") || 
                error.message.includes("network")
            ) {
                return { success: false, error: "Database connection error" };
            }
        }
        
        return { success: false, error: "Authentication service unavailable" };
    }
}

export const signUpWithCredentials = async (name: string, email: string, password: string) => {
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })
        
        if (existingUser) {
            return { success: false, error: "Email already in use" }
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)
        
        // Create user
        try {
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            })
        } catch (createError: any) {
            // Handle specific database errors for user creation
            console.error("Database error during user creation:", createError);
            
            if (createError.code === 'P2002') {
                return { success: false, error: "Email already exists in our system" };
            }
            
            if (createError.code === 'P2000') {
                return { success: false, error: "One of the provided values is too long" };
            }
            
            return { 
                success: false, 
                error: "Failed to create account due to database error",
                details: process.env.NODE_ENV === 'development' ? createError.message : undefined 
            };
        }
        
        // Sign in the user without redirect
        try {
            await signIn("credentials", {
                email,
                password,
                redirect: false
            })
            return { success: true }
        } catch (error: any) {
            console.error("Error during auto-login after signup:", error)
            // Return success with a message since account was created but auto-login failed
            return { success: true, message: "Account created! Please log in." }
        }
    } catch (error: any) {
        console.error("Error during signup:", error)
        return { 
            success: false, 
            error: "Failed to create account: " + (error.message || "Unknown error"),
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }
    }
}