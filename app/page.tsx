"use client"

import { useAuth } from "@/contexts/AuthContext"
import { LoginForm } from "@/components/auth/LoginForm"
import { Dashboard } from "@/components/dashboard/Dashboard"
import { Suspense } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  )
}
