// Use the Railway-specific auth implementation for better Prisma handling
import { handlers } from '@/auth-railway'

// Specify nodejs runtime to avoid Edge Runtime issues
export const runtime = 'nodejs';

// Export the GET and POST handlers from NextAuth
export const { GET, POST } = handlers;