"use client"

import type React from "react"

import { useState } from "react"
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
import { Menu, LogOut } from "lucide-react"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { logout } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    setLogoutDialogOpen(false)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLogoutDialogOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
