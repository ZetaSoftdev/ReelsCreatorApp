"use client"

import * as React from "react"
import { ChevronRight, ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"
import Link from "next/link"
import { useLogoContext } from "@/context/LogoContext"

export function CompanyLogo({
  teams,
}: {
  teams: {
  logo: string
  name: string
  link: string
  }
}) {
  const { branding } = useLogoContext();
  const logoUrl = branding.logoUrl || '/logo.png';
  const siteName = branding.siteName || teams.name;

  return (
     <Link href={teams.link} className="flex items-center gap-3 p-3">
          <Collapsible
            asChild
            className="group/collapsible"
          >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <Image src={logoUrl} alt={siteName} width={130} height={30}/>
                  {/* <span>{siteName}</span> */}
                </SidebarMenuButton>
              </CollapsibleTrigger>
          </Collapsible>
    </Link>
  )
}
