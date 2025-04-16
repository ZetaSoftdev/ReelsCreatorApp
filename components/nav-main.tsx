"use client"

import { type LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ElementType
    isActive?: boolean
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <a 
                href={item.url} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                  item.isActive 
                    ? "bg-purple-100 text-purple-600" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                {item.icon && (
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6",
                    item.isActive ? "text-purple-600" : "text-gray-500"
                  )}>
                    <item.icon size={20} />
                  </span>
                )}
                <span className="text-base font-medium">{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
