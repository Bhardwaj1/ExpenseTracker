"use client"

import { useState, lazy, Suspense } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Header } from "@/components/layout/Header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Lazy load components for better performance
const OverviewTab = lazy(() => import("@/components/dashboard/OverviewTab"))
const TransactionsTab = lazy(() => import("@/components/transactions/TransactionsTab"))
const AnalyticsTab = lazy(() => import("@/components/analytics/AnalyticsTab"))
const UsersTab = lazy(() => import("@/components/users/UsersTab"))

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />
      case "transactions":
        return <TransactionsTab />
      case "analytics":
        return <AnalyticsTab />
      case "users":
        return <UsersTab />
      default:
        return <OverviewTab />
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner />
                </div>
              }
            >
              {renderContent()}
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
