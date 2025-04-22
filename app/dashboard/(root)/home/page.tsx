import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/lib/constants";
import HomeSidebar from "./components/HomeSidebar";

// Force cache revalidation to ensure fresh session data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server Component to check auth
async function HomePageWithAuth() {
  // Get fresh session data
  const session = await auth();
  
  // Check authentication
  if (!session?.user) {
    redirect("/login");
  }
  
  // No longer redirect admins away from home page
  // Admin users can now access the home page as well
  
  // Pass session data directly to the HomeSidebar component
  // instead of storing in localStorage
  return <HomeSidebar />;
}

// Main page component - this will be the default export
export default async function HomePage() {
  return <HomePageWithAuth />;
}
