import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./app/globals.css"
import { AppLayout } from "@/components/layout/AppLayout"

export const metadata: Metadata = {
  title: "Caribou Coffee - Maintenance System",
  description: "Web-based maintenance request management system for Caribou Coffee",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
