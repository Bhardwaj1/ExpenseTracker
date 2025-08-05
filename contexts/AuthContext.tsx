"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user" | "read-only"
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (action: "read" | "write" | "admin") => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const hasPermission = useCallback(
    (action: "read" | "write" | "admin") => {
      if (!user) return false

      switch (action) {
        case "admin":
          return user.role === "admin"
        case "write":
          return user.role === "admin" || user.role === "user"
        case "read":
          return true // All authenticated users can read
        default:
          return false
      }
    },
    [user],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await apiClient.post("/auth/login", { email, password })
        const { user: userData, token } = response.data

        localStorage.setItem("token", token)
        setUser(userData)

        toast({
          title: "Success",
          description: "Logged in successfully",
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Login failed",
          variant: "destructive",
        })
        throw error
      }
    },
    [toast],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const response = await apiClient.post("/auth/register", { name, email, password })
        const { user: userData, token } = response.data

        localStorage.setItem("token", token)
        setUser(userData)

        toast({
          title: "Success",
          description: "Account created successfully",
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Registration failed",
          variant: "destructive",
        })
        throw error
      }
    },
    [toast],
  )

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    setUser(null)
    toast({
      title: "Success",
      description: "Logged out successfully",
    })
  }, [toast])

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await apiClient.get("/auth/me")
        setUser(response.data.user)
      } catch (error) {
        localStorage.removeItem("token")
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
