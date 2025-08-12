"use client"

import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import type { User } from "@/lib/types"

export function useAuth() {
  const [user, loading, error] = useAuthState(auth)

  const userData: User | null = user
    ? {
        email: user.email!,
        isManager: user.email === "manager@caribou.com",
        branchCode: user.email?.split("@")[0],
      }
    : null

  return {
    user: userData,
    loading,
    error,
    isAuthenticated: !!user,
  }
}
