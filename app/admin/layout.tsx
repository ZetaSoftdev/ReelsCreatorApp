"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Film, 
  Settings, 
  LogOut,
  Home,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { loginOut } from "@/lib/auth";
import { useState, useEffect } from "react";
import Image from "next/image";

// Admin sidebar navigation items
const sidebarItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Videos", href: "/admin/content", icon: Film },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

// Define branding settings type
type BrandingSettings = {
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  defaultFont: string;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    siteName: "Reels Creator",
    logoUrl: "/logo.png",
    faviconUrl: null,
    primaryColor: "#8B5CF6",
    accentColor: "#F59E0B",
    defaultFont: "Poppins"
  });
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    await loginOut();
  };

  // Fetch branding settings from API
  useEffect(() => {
    const fetchBrandingSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/branding');
        if (!response.ok) {
          throw new Error('Failed to fetch branding settings');
        }
        
        const data = await response.json();
        setBrandingSettings({
          siteName: data.siteName || "Reels Creator",
          logoUrl: data.logoUrl || "/logo.png",
          faviconUrl: data.faviconUrl || null,
          primaryColor: data.primaryColor || "#8B5CF6",
          accentColor: data.accentColor || "#F59E0B",
          defaultFont: data.defaultFont || "Poppins"
        });
      } catch (error) {
        console.error("Error fetching branding settings:", error);
        // Fallback to defaults if API fails
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrandingSettings();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      {/* Sidebar */}
      <aside 
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } bg-white border-r border-[#e0e0e0] shadow-sm transition-all duration-300 ease-in-out fixed h-full z-10`}
        style={{
          // Apply branding colors to the sidebar
          borderColor: `${brandingSettings.accentColor}20`
        }}
      >
        <div className="p-4 border-b border-[#e0e0e0] flex justify-between items-center">
          {!collapsed && (
            <div className="flex items-center">
              {brandingSettings.logoUrl ? (
                <Image 
                  src={brandingSettings.logoUrl} 
                  width={140} 
                  height={40} 
                  alt={brandingSettings.siteName} 
                  className="object-contain h-8"
                  onError={() => setBrandingSettings(prev => ({...prev, logoUrl: "/logo.png"}))}
                />
              ) : (
                <h2 className="text-xl font-bold" style={{ color: brandingSettings.primaryColor }}>
                  {brandingSettings.siteName}
                </h2>
              )}
            </div>
          )}
          
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-[#f5f5f5] text-[#343434]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        <nav className="p-2">
          <ul className="space-y-2">
            {/* Home button - takes admin back to regular user home page */}
            <li>
              <Link 
                href="/dashboard/home"
                className="flex items-center p-2 rounded-lg text-sm text-[#343434] hover:bg-[#f5f5f5]"
                title="Main Home"
              >
                <Home className="w-5 h-5 min-w-5" />
                {!collapsed && <span className="ml-3">Main Home</span>}
              </Link>
            </li>
            
            {/* Divider */}
            <li className="py-2">
              <div className="border-t border-[#e0e0e0]"></div>
            </li>
            
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className={`flex items-center p-2 rounded-lg text-sm ${
                      isActive 
                        ? "text-white" 
                        : "text-[#343434] hover:bg-[#f5f5f5]"
                    }`}
                    style={{
                      backgroundColor: isActive ? brandingSettings.primaryColor : 'transparent'
                    }}
                    title={item.name}
                  >
                    <Icon className="w-5 h-5 min-w-5" />
                    {!collapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
            
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center p-2 w-full text-left rounded-lg text-sm text-[#343434] hover:bg-[#f5f5f5]"
                title="Log Out"
              >
                <LogOut className="w-5 h-5 min-w-5" />
                {!collapsed && <span className="ml-3">Log Out</span>}
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-white shadow-md text-[#343434]"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
      </div>
      
      {/* Main content */}
      <main className={`transition-all duration-300 ease-in-out flex-1 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 