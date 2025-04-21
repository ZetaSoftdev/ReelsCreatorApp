"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  DollarSign,
  Frame,
  GalleryVerticalEnd,
  HomeIcon,
  LayoutDashboard,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { CompanyLogo } from "./company-logo"
import { useSession } from 'next-auth/react'
import { GrSchedule, GrServices } from "react-icons/gr"
import { MdAutoFixNormal } from "react-icons/md"
import { usePathname } from 'next/navigation'
import { useLogoContext } from "@/context/LogoContext"
import { Role } from "@/lib/constants"
import { useState, useEffect } from "react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { branding } = useLogoContext()
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setIsAdmin(user.role === Role.ADMIN);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  }, []);

  // This is sample data.
  const data = {
    user: {
      name: session?.user?.name || "Guest User",
      email: session?.user?.email || "guest@example.com",
      avatar: session?.user?.image || "/default-avatar.png",
      id: session?.user?.id || "user-1",
    },
    logo: {
      logo: branding.logoUrl || "/trod.png",
      name: branding.siteName,
      link: "/dashboard/home"
    },
    navMain: [
      {
        title: "Home",
        url: "/dashboard/home",
        icon: HomeIcon,
        isActive: pathname === "/dashboard/home",
      },
      {
        title: "Publish & Schedule",
        url: "/dashboard/schedule",
        icon: GrSchedule,
        isActive: pathname === "/dashboard/schedule",
      },
      {
        title: "Automated Series",
        url: "/dashboard/automated-series",
        icon: MdAutoFixNormal,
        isActive: pathname === "/dashboard/automated-series",
      },
      {
        title: "Services",
        url: "/dashboard/services",
        icon: GrServices,
        isActive: pathname === "/dashboard/services",
      },
      {
        title: "Pricing",
        url: "/dashboard/pricing",
        icon: DollarSign,
        isActive: pathname === "/dashboard/pricing",
      },
    ],
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Travel",
        url: "#",
        icon: Map,
      },
    ],
  }

  // Weather widget data
  const weatherData = {
    temperature: "26°C",
    condition: "Haze",
    alert: 3
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <div className="absolute top-5 right-3 hidden sm:block">
        <SidebarTrigger />
      </div>
      <SidebarHeader className="pt-4 pb-2">
        <CompanyLogo teams={data.logo} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* Admin Dashboard Button - Only visible on mobile for admin users */}
        {isAdmin && (
          <div className="px-4 py-2 sm:hidden">
            <h1 className="pl-1">Admin</h1>
            <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md ">
              <LayoutDashboard size={20} className="mr-2"/>
              <span>Admin Dashboard</span>
            </Link>
          </div>
        )}
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-4">
        <NavUser user={data?.user} />
        
        
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
