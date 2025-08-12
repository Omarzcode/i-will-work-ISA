"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, FileText, Plus, BarChart3, Users, Building } from "lucide-react"
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

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredItems = navigationItems.filter((item) => {
    if (user?.isManager) {
      // For managers, only show these specific items
      return ["Dashboard", "Manage Requests", "Analytics"].includes(item.title)
    }
    // For regular users, show user items
    return item.roles.includes("user")
  })

  return (
    <div className="flex h-full w-full flex-col bg-white border-r rounded-r-3xl">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-3">
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
            <h1 className="text-lg font-bold text-gray-900">Caribou</h1>
            <p className="text-xs text-gray-500">Maintenance System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b">
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
      <ScrollArea className="flex-1 px-3 py-4">
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
                onClick={() => router.push(item.href)}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
