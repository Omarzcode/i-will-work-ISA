"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Home, FileText, Plus, BarChart3, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Requests", href: "/my-requests", icon: FileText },
  { name: "New", href: "/create-request", icon: Plus },
]

const managerNavigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Requests", href: "/manager", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "New", href: "/create-request", icon: Plus },
]

export function MobileNav() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const navItems = user?.isManager ? managerNavigation : navigation

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.name}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3",
                isActive ? "text-blue-600" : "text-gray-600",
              )}
              onClick={() => router.push(item.href)}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-blue-600")} />
              <span className={cn("text-xs", isActive && "text-blue-600 font-medium")}>{item.name}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
