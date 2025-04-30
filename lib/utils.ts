import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a relative URL to an absolute URL using the current environment
 */
export function absoluteUrl(path: string) {
  // In production, use the actual hostname
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}${path}`;
  }
  
  // Use the NEXT_PUBLIC_APP_URL environment variable if set
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
  }
  
  // Fallback to localhost in development
  return `http://localhost:${process.env.PORT || 3000}${path}`;
}
