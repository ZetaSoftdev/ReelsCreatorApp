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
  Menu,
  X
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await loginOut();
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch branding settings from API
  useEffect(() => {
    const fetchBrandingSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/branding', {
          next: { revalidate: 3600 } // Revalidate every hour
        });
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
      {/* Desktop sidebar */}
      <aside 
        className={`
          ${collapsed ? 'w-16' : 'w-64'} 
          bg-white border-r border-[#e0e0e0] shadow-sm transition-all duration-300 ease-in-out 
          fixed h-full z-10 hidden lg:block
        `}
        style={{
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
        
        <SidebarContent 
          collapsed={collapsed} 
          pathname={pathname} 
          brandingSettings={brandingSettings} 
          handleLogout={handleLogout}
        />
      </aside>
      
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-30 h-full bg-white w-[280px] shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4 border-b border-[#e0e0e0] flex justify-between items-center">
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
          
          <button 
            onClick={toggleMobileSidebar}
            className="p-1 rounded-md hover:bg-[#f5f5f5] text-[#343434]"
            aria-label="Close mobile sidebar"
          >
            <X size={20} />
          </button>
        </div>
        
        <SidebarContent 
          collapsed={false} 
          pathname={pathname} 
          brandingSettings={brandingSettings} 
          handleLogout={handleLogout}
        />
      </aside>
      
      {/* Mobile Menu Toggle Button */}
      <div className="fixed top-4 left-4 z-20 lg:hidden">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-full bg-white shadow-md text-[#343434] hover:bg-[#f5f5f5]"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
      </div>
      
      {/* Main content */}
      <main className={`transition-all duration-300 ease-in-out flex-1 ${
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      } ml-0 pt-16 lg:pt-0`}>
        <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

// Extracted sidebar content component for reuse
function SidebarContent({
  collapsed,
  pathname,
  brandingSettings,
  handleLogout
}: {
  collapsed: boolean;
  pathname: string;
  brandingSettings: BrandingSettings;
  handleLogout: () => void;
}) {
  return (
    <nav className="p-2 overflow-y-auto h-[calc(100%-64px)]">
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
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
  );
} 