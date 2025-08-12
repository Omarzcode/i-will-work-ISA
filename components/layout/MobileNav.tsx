"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Home, FileText, Plus, BarChart3, Users, Building, X, ChevronRight } from "lucide-react"
import Image from "next/image"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["user", "manager"],
    description: "Overview and stats",
  },
  {
    title: "Create Request",
    href: "/create-request",
    icon: Plus,
    roles: ["user"],
    description: "Submit new request",
  },
  {
    title: "My Requests",
    href: "/my-requests",
    icon: FileText,
    roles: ["user"],
    description: "Track your requests",
  },
  {
    title: "Manage Requests",
    href: "/manager",
    icon: Users,
    roles: ["manager"],
    description: "Review all requests",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["manager"],
    description: "Reports and insights",
  },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredItems = navigationItems.filter((item) => {
    if (user?.isManager) {
      return item.roles.includes("manager")
    }
    return item.roles.includes("user")
  })

  const handleNavigation = (href: string) => {
    router.push(href)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full max-w-sm p-0 rounded-r-3xl">
        <div className="flex h-full flex-col">
          {/* Header - Enhanced for mobile */}
          <SheetHeader className="flex-row items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center p-1 shadow-sm">
                <Image
                  src="/maintenance-logo.png"
                  alt="Maintenance System"
                  width={36}
                  height={36}
                  className="object-contain rounded-xl"
                />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold text-blue-900">Caribou</SheetTitle>
                <p className="text-sm text-blue-600">Maintenance System</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-12 w-12 rounded-2xl hover:bg-blue-200 active:bg-blue-300"
            >
              <X className="h-6 w-6 text-blue-700" />
            </Button>
          </SheetHeader>

          {/* User Info - Enhanced mobile design */}
          <div className="p-6 border-b bg-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-sm">
                <Building className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.isManager ? "Manager" : user?.branchCode}
                  </p>
                  {user?.isManager && <Badge className="bg-blue-100 text-blue-800 text-xs rounded-full">Admin</Badge>}
                </div>
                <p className="text-sm text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation - Mobile optimized */}
          <ScrollArea className="flex-1 px-4 py-6">
            <nav className="space-y-3">
              {filteredItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={`w-full h-16 justify-start gap-4 rounded-2xl p-4 transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                        : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                    }`}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <div className={`p-2 rounded-xl ${isActive ? "bg-blue-500" : "bg-gray-100"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-base">{item.title}</p>
                      <p className={`text-sm ${isActive ? "text-blue-100" : "text-gray-500"}`}>{item.description}</p>
                    </div>
                    <ChevronRight className={`h-5 w-5 ${isActive ? "text-blue-200" : "text-gray-400"}`} />
                  </Button>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Footer - App version or additional info */}
          <div className="p-4 border-t bg-gray-50">
            <p className="text-center text-xs text-gray-500">Caribou Maintenance v1.0</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
