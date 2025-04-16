import { DefaultSession } from "next-auth"
import { Role } from "../lib/constants"

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    role?: Role
  }
}

declare module "next-auth/jwt" {
  /** Extend the built-in JWT types */
  interface JWT {
    role?: Role
  }
} 