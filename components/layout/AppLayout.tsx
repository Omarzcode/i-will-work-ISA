"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "./Sidebar"
import { MobileNav } from "./MobileNav"
import { NotificationBell } from "./NotificationBell"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LogOut, Menu } from "lucide-react"
import Image from "next/image"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      await logout()
      setLogoutDialogOpen(false)
      router.replace("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="w-8 h-8 bg-blue-100 rounded-2xl flex items-center justify-center p-1 mx-auto mb-2">
            <Image
              src="/maintenance-logo.png"
              alt="Maintenance System"
              width={24}
              height={24}
              className="object-contain rounded-xl"
            />
          </div>
          <p className="text-blue-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Optimized for touch */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-white border-b shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-12 w-12 rounded-2xl hover:bg-blue-50 active:bg-blue-100 transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center p-1">
                <Image
                  src="/maintenance-logo.png"
                  alt="Maintenance System"
                  width={32}
                  height={32}
                  className="object-contain rounded-xl"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">Caribou</span>
                <p className="text-xs text-gray-500 leading-none">Maintenance</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLogoutDialogOpen(true)}
              className="h-12 w-12 rounded-2xl hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              <LogOut className="h-5 w-5 text-gray-700" />
            </Button>
          </div>
        </div>
        <MobileNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <div className="w-64 fixed inset-y-0 left-0 z-50">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          {/* Top Bar */}
          <div className="bg-white border-b px-6 py-4 rounded-bl-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {user.isManager ? "Manager Dashboard" : `Branch ${user.branchCode}`}
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <Button variant="ghost" size="icon" onClick={() => setLogoutDialogOpen(true)} className="rounded-2xl">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-6">
            <div className="bg-white rounded-3xl shadow-sm border min-h-[calc(100vh-200px)] p-6">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile Content - Optimized spacing and touch targets */}
      <div className="lg:hidden">
        <main className="flex-1 p-3">
          <div className="bg-white rounded-3xl shadow-sm border min-h-[calc(100vh-100px)] p-4 mb-20">{children}</div>
        </main>
      </div>

      {/* Logout Confirmation Dialog - Mobile optimized */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Confirm Logout</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to logout? You will need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)} className="rounded-2xl h-12 w-full">
              Cancel
            </Button>
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 w-full">
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
