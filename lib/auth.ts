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
        
        // First check if the user exists - with better error handling
        let userExists = null;
        try {
            userExists = await prisma.user.findUnique({
                where: { email },
                select: { id: true, password: true }
            });
            
            console.log(`User lookup result for ${email}: ${userExists ? 'found' : 'not found'}`);
        } catch (dbError) {
            console.error(`Database error during user lookup for ${email}:`, dbError);
            
            // Check for connection errors
            const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
            if (
                errorMessage.includes("connection") || 
                errorMessage.includes("ECONNREFUSED") || 
                errorMessage.includes("timed out")
            ) {
                return { 
                    success: false, 
                    error: "Database connection error. Please try again later.",
                    code: "DB_CONNECTION_ERROR" 
                };
            }
            
            // Other database errors
            return { 
                success: false, 
                error: "Error verifying account. Please try again.",
                code: "DB_ERROR" 
            };
        }
        
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
            
            // Get user data after successful login - with better error handling
            let user = null;
            try {
                user = await prisma.user.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true
                    }
                });
            } catch (userLookupError) {
                console.error("Database error fetching user data after login:", userLookupError);
                return { 
                    success: true, 
                    error: "Login successful but failed to load user data. Please refresh and try again.",
                    partialSuccess: true 
                };
            }
            
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
            
            // Specific handling for different types of NextAuth errors
            if (signInError instanceof Error) {
                if (signInError.message.includes("CredentialsSignin")) {
                    return { success: false, error: "Invalid password" };
                }
                
                if (signInError.message.includes("network") || signInError.message.includes("connection")) {
                    return { success: false, error: "Authentication service unavailable. Please try again later." };
                }
            }
            
            return { success: false, error: "Authentication failed. Please try again." };
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
                return { success: false, error: "Database connection error. Please try again later." };
            }
        }
        
        return { success: false, error: "Authentication service unavailable. Please try again later." };
    }
}

export const signUpWithCredentials = async (name: string, email: string, password: string) => {
    try {
        // Check if user already exists - with better error handling
        let existingUser = null;
        try {
            existingUser = await prisma.user.findUnique({
                where: { email }
            });
        } catch (dbLookupError) {
            console.error("Database error during user existence check:", dbLookupError);
            
            // Check for connection errors
            const errorMessage = dbLookupError instanceof Error ? dbLookupError.message : String(dbLookupError);
            if (
                errorMessage.includes("connection") || 
                errorMessage.includes("ECONNREFUSED") || 
                errorMessage.includes("timed out")
            ) {
                return { 
                    success: false, 
                    error: "Database connection error. Please try again later.",
                    code: "DB_CONNECTION_ERROR" 
                };
            }
            
            return { 
                success: false, 
                error: "Error creating account. Please try again later.",
                code: "DB_ERROR" 
            };
        }
        
        if (existingUser) {
            return { success: false, error: "Email already in use" };
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user - with better error handling
        try {
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
        } catch (createError) {
            console.error("Database error during user creation:", createError);
            
            // Check for duplicate key errors (race condition where user was created in parallel)
            const errorMessage = createError instanceof Error ? createError.message : String(createError);
            if (errorMessage.includes("Unique constraint")) {
                return { success: false, error: "Email already in use" };
            }
            
            // Check for connection errors
            if (
                errorMessage.includes("connection") || 
                errorMessage.includes("ECONNREFUSED") || 
                errorMessage.includes("timed out")
            ) {
                return { 
                    success: false, 
                    error: "Database connection error. Please try again later.",
                    code: "DB_CONNECTION_ERROR" 
                };
            }
            
            return { 
                success: false, 
                error: "Error creating account. Please try again.",
                code: "DB_ERROR" 
            };
        }
        
        // Sign in the user without redirect
        try {
            await signIn("credentials", {
                email,
                password,
                redirect: false
            });
            return { success: true };
        } catch (error) {
            console.error("Error during auto-login after signup:", error);
            // Even if auto-login fails, the account was created successfully
            return { 
                success: true, 
                message: "Account created! Please log in.",
                requireLogin: true
            };
        }
    } catch (error) {
        console.error("Error during signup:", error);
        return { 
            success: false, 
            error: "Failed to create account. Please try again later.",
            code: "GENERAL_ERROR"
        };
    }
}