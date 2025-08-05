"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { LayoutDashboard, CreditCard, BarChart3, Users, DollarSign, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AppSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  const { user, logout, hasPermission } = useAuth()

  const menuItems = [
    {
      title: "Overview",
      icon: LayoutDashboard,
      id: "overview",
      permission: "read" as const,
    },
    {
      title: "Transactions",
      icon: CreditCard,
      id: "transactions",
      permission: "read" as const,
    },
    {
      title: "Analytics",
      icon: BarChart3,
      id: "analytics",
      permission: "read" as const,
    },
    {
      title: "Users",
      icon: Users,
      id: "users",
      permission: "admin" as const,
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => hasPermission(item.permission))

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold">Finance Tracker</h2>
            <p className="text-sm text-muted-foreground">
              {user?.role === "admin" ? "Administrator" : user?.role === "read-only" ? "Read Only" : "User"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <div className="text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="w-full bg-transparent">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
