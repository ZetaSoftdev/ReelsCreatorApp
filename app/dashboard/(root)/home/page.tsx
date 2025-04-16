import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/lib/constants";
import HomeSidebar from "./components/HomeSidebar";
import { headers } from "next/headers";

// This component will be used to update the localStorage with user data
// on the client side when the page is loaded
const UserDataUpdater = ({ userData }: { userData: string }) => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          try {
            localStorage.setItem('userData', '${userData.replace(/'/g, "\\'")}');
          } catch (e) {
            console.error('Failed to update userData:', e);
          }
        `,
      }}
    />
  );
};

// Server Component to check auth
async function HomePageWithAuth() {
  const session = await auth();
  
  // Check authentication
  if (!session?.user) {
    redirect("/login");
  }
  
  // No longer redirect admins away from home page
  // Admin users can now access the home page as well
  
  // Prepare user data for client components
  const userData = JSON.stringify({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role
  });
  
  // If authenticated as any user (admin or regular), render the home page
  return (
    <>
      <UserDataUpdater userData={userData} />
      <HomeSidebar />
    </>
  );
}

// Main page component - this will be the default export
export default async function HomePage() {
  return <HomePageWithAuth />;
}
