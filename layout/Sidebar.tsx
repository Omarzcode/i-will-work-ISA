"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NotificationBell } from "./NotificationBell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Home, FileText, Plus, BarChart3, Users, LogOut, Menu, Coffee } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Requests", href: "/my-requests", icon: FileText },
  { name: "New Request", href: "/create-request", icon: Plus },
]

const managerNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "All Requests", href: "/manager", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "New Request", href: "/create-request", icon: Plus },
]

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.replace("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleNavigation = (href: string) => {
    try {
      router.push(href)
    } catch (error) {
      console.error("Navigation error:", error)
      // Fallback to window.location if router fails
      window.location.href = href
    }
  }

  const navItems = user?.isManager ? managerNavigation : navigation

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <Coffee className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">Caribou Coffee</h1>
          <p className="text-xs text-gray-500">Maintenance System</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.branchCode?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.isManager ? "Admin" : user?.branchCode}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12",
                isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-700 hover:bg-gray-100",
              )}
              onClick={() => handleNavigation(item.href)}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-red-600 hover:bg-red-50">
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to logout? You will need to sign in again to access the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0", className)}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
