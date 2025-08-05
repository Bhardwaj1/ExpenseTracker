"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/contexts/ThemeContext"
import { Moon, Sun } from "lucide-react"

export function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="border-b bg-white dark:bg-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold">Personal Finance Tracker</h1>
        </div>

        <Button variant="outline" size="sm" onClick={toggleTheme}>
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}
