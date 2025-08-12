"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, FileText, Plus, BarChart3, Users, Building, X } from "lucide-react"
import Image from "next/image"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["user", "manager"],
  },
  {
    title: "Create Request",
    href: "/create-request",
    icon: Plus,
    roles: ["user"],
  },
  {
    title: "My Requests",
    href: "/my-requests",
    icon: FileText,
    roles: ["user"],
  },
  {
    title: "Manage Requests",
    href: "/manager",
    icon: Users,
    roles: ["manager"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["manager"],
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
      <SheetContent side="left" className="w-80 p-0 rounded-r-3xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="flex-row items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center p-1">
                <Image
                  src="/maintenance-logo.png"
                  alt="Maintenance System"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-gray-900">Caribou</SheetTitle>
                <p className="text-xs text-gray-500">Maintenance System</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl">
              <X className="h-5 w-5" />
            </Button>
          </SheetHeader>

          {/* User Info */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.isManager ? "Manager" : user?.branchCode}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-6 py-4">
            <nav className="space-y-2">
              {filteredItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 rounded-2xl ${
                      isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Button>
                )
              })}
            </nav>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
