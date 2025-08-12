"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, User, Shield } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.replace("/dashboard")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
      router.replace("/dashboard")
    } catch (error: any) {
      setError("Invalid email or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (type: "manager" | "branch") => {
    if (type === "manager") {
      setEmail("manager@caribou.com")
      setPassword("manager123")
    } else {
      setEmail("branch001@caribou.com")
      setPassword("branch123")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg p-2">
            <Image
              src="/maintenance-logo.png"
              alt="Maintenance System"
              width={80}
              height={80}
              className="object-contain rounded-2xl"
            />
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-6 pt-8">
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600 text-base">Sign in to continue</CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 px-4 bg-gray-50 border-0 rounded-2xl text-gray-700 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2 relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 px-4 pr-12 bg-gray-50 border-0 rounded-2xl text-gray-700 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50 rounded-xl">
                  <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-lg rounded-2xl shadow-lg transition-all duration-200 border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Need Help Link */}
            <div className="text-center mt-6">
              <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Need help?</button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="mt-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="text-lg font-semibold text-center text-gray-800">Demo Accounts</CardTitle>
            <CardDescription className="text-center text-gray-600 text-sm">
              Try the system with these demo credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors bg-white/80 rounded-2xl"
              onClick={() => fillDemoCredentials("manager")}
            >
              <Shield className="mr-2 h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-700">Manager Account</span>
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-colors bg-white/80 rounded-2xl"
              onClick={() => fillDemoCredentials("branch")}
            >
              <User className="mr-2 h-4 w-4 text-green-600" />
              <span className="font-medium text-gray-700">Branch Account</span>
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-white/80">© 2024 Caribou Maintenance System. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
