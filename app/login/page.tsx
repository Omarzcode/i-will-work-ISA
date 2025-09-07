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
const GoogleIcon = () => (
  <svg viewBox="-0.5 0 48 48" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g>
        <g>
          <path d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24" fill="#FBBC05"></path>
          <path d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333" fill="#EB4335"></path>
          <path d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667" fill="#34A853"></path>
          <path d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24" fill="#4285F4"></path>
        </g>
      </g>
    </g>
  </svg>
);
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
const { user, login, signInWithGoogle } = useAuth();
const router = useRouter()
  const x =0
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
  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (error: any) {
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
};

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
            {/* --- New Google Sign-In Section --- */}
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-white px-2 text-gray-500">
      Or continue with
    </span>
  </div>
</div>

<Button
  variant="outline"
  onClick={handleGoogleLogin}
  disabled={isLoading}
  className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg rounded-2xl shadow-md transition-all duration-200 border border-gray-200"
>
  <GoogleIcon />
  <span className="ml-3">Sign in with Google</span>
</Button>
{/* --- End of New Section --- */}

            {/* app Link */}
<div className="text-center mt-6">
  <a
    href="/app-release.apk"
    download
    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
  >
    Download the app for Android
  </a>
</div>

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
