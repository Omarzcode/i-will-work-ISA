"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"

export default function HomePage() {
  const [user, loading, error] = useAuthState(auth)
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    console.log("Auth state:", { user: user?.email, loading, error })

    if (!loading && !redirecting) {
      setRedirecting(true)
      if (user) {
        console.log("User authenticated, redirecting to dashboard")
        router.replace("/dashboard")
      } else {
        console.log("User not authenticated, redirecting to login")
        router.replace("/login")
      }
    }
  }, [user, loading, error, router, redirecting])

  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 to-blue-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 to-blue-500">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Authentication Error</p>
          <p className="mb-4">{error.message}</p>
          <button onClick={() => window.location.reload()} className="bg-white text-blue-600 px-4 py-2 rounded">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return null
}
