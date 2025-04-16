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
    await signOut({ redirectTo: "/login" })
}

export const loginWithCredentials = async (email: string, password: string) => {
    try {
        // First try signing in
        await signIn("credentials", {
            email,
            password,
            redirect: false
        })
        
        // Get basic user information after successful login
        const user = await prisma.user.findUnique({
            where: { email }
        })
        
        if (!user) {
            return { success: false, error: "User not found" }
        }
        
        // Create a safe user object with only the data we need
        const safeUser = {
            id: user.id,
            email: user.email,
            name: user.name || "",
            // For role, check if it exists in the user object or provide a default
            role: user.hasOwnProperty('role') 
                ? (user as any).role 
                : Role.USER // Default role if not set
        }
        
        return { 
            success: true,
            user: safeUser
        }
    } catch (error) {
        console.error("Error during credential login:", error)
        return { success: false, error: "Invalid email or password" }
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
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })
        
        // Sign in the user without redirect
        try {
            await signIn("credentials", {
                email,
                password,
                redirect: false
            })
            return { success: true }
        } catch (error) {
            console.error("Error during auto-login after signup:", error)
            return { success: true, message: "Account created! Please log in." }
        }
    } catch (error) {
        console.error("Error during signup:", error)
        return { success: false, error: "Failed to create account" }
    }
}