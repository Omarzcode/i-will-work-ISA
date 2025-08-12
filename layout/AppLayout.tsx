"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "./Sidebar"
import { MobileNav } from "./MobileNav"
import { Toaster } from "@/components/ui/toaster"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="pb-16 lg:pb-0">{children}</main>
      </div>
      <MobileNav />
      <Toaster />
    </div>
  )
}
