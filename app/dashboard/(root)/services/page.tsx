import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/lib/constants";
import HomeHeader from "@/components/HomeHeader";

// Server Component to check auth
export default async function ServicesPage() {
  const session = await auth();
  
  // Check authentication
  if (!session?.user) {
    redirect("/login");
  }
  
  return (
    <>
      <HomeHeader pageName="Services" />
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Our Services</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all">
            <h2 className="text-xl font-semibold mb-3">Video Shorts</h2>
            <p className="text-gray-600 mb-4">
              Convert your long-form content into engaging short-form videos optimized for social media platforms.
            </p>
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm inline-block">
              Popular
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all">
            <h2 className="text-xl font-semibold mb-3">AI Editing</h2>
            <p className="text-gray-600 mb-4">
              Use our AI-powered editing tools to automatically enhance your videos with smart cuts and transitions.
            </p>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm inline-block">
              New
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all">
            <h2 className="text-xl font-semibold mb-3">Content Repurposing</h2>
            <p className="text-gray-600 mb-4">
              Transform your existing content into multiple formats for different platforms and audiences.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all">
            <h2 className="text-xl font-semibold mb-3">Analytics Dashboard</h2>
            <p className="text-gray-600 mb-4">
              Track the performance of your videos across platforms with our integrated analytics.
            </p>
          </div>
        </div>
        
        <div className="mt-10 bg-gradient-to-r from-purple-500 to-blue-500 p-8 rounded-lg text-white">
          <h2 className="text-2xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="mb-6">
            Our team can create tailored video solutions to meet your specific needs and objectives.
          </p>
          <button className="bg-white text-purple-600 hover:bg-gray-100 transition-colors px-6 py-2 rounded-full font-medium">
            Contact Us
          </button>
        </div>
      </div>
    </>
  );
} 