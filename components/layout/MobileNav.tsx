"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { Home, FileText, Plus, BarChart3, User, Building2, Users } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user } = useAuth()

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Overview and quick stats",
      roles: ["user", "manager"],
    },
    {
      title: "Create Request",
      href: "/create-request",
      icon: Plus,
      description: "Submit a new maintenance request",
      roles: ["user"],
    },
    {
      title: "My Requests",
      href: "/my-requests",
      icon: FileText,
      description: "Track your submitted requests",
      roles: ["user"],
    },
    {
      title: "Manage Requests",
      href: "/manager",
      icon: Users,
      description: "Manage all requests from branches",
      roles: ["manager"],
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      description: "View detailed reports and insights",
      roles: ["manager"],
    },
  ]

  const filteredItems = navigationItems.filter((item) => {
    if (user?.isManager) {
      // For managers, only show these specific items
      return ["Dashboard", "Manage Requests", "Analytics"].includes(item.title)
    }
    return item.roles.includes("user")
  })

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 bg-gradient-to-br from-blue-50 to-indigo-100">
        <SheetHeader className="p-6 pb-4 bg-white/80 backdrop-blur-sm border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center p-2">
              <Image
                src="/maintenance-logo.png"
                alt="Maintenance System"
                width={32}
                height={32}
                className="object-contain rounded-xl"
              />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-gray-900">Caribou</SheetTitle>
              <p className="text-sm text-gray-600">Maintenance System</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className="p-6 bg-white/60 backdrop-blur-sm border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.email}</p>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Building2 className="w-5 h-5" />
                  <span>Branch {user?.branchCode}</span>
                  {user?.isManager && <span className="text-blue-600 font-medium">• Manager</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} onClick={onClose}>
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-4 justify-start rounded-2xl hover:bg-white/80 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </div>
                    </div>
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 bg-white/60 backdrop-blur-sm border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600">Caribou Maintenance System</p>
              <p className="text-xs text-gray-500 mt-1">Version 2.0</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}