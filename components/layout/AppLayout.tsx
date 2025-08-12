"use client"

import type React from "react"
import { Sidebar } from "./Sidebar"
import { NotificationBell } from "./NotificationBell"
import Image from "next/image"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center justify-between">
            {/* Mobile menu button and logo */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="lg:hidden">
                <Sidebar />
              </div>
              <div className="lg:hidden flex items-center space-x-2">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <Image src="/caribou-logo.png" alt="Caribou Coffee" width={20} height={20} className="rounded-full" />
                </div>
                <span className="text-lg font-semibold text-gray-900">Caribou</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
