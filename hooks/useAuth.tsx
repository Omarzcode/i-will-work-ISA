"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Try to get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              branchCode: userData.branchCode,
              isManager: userData.isManager || false,
            })
          } else {
            // Create user data based on email
            const isManager = firebaseUser.email?.includes("manager") || false
            const branchCode = isManager ? "HQ" : firebaseUser.email?.split("@")[0] || "unknown"

            const newUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              branchCode,
              isManager,
              createdAt: new Date(),
            }

            // Save to Firestore
            await setDoc(doc(db, "users", firebaseUser.uid), newUserData)

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              branchCode,
              isManager,
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          // Fallback user creation without Firestore
          const isManager = firebaseUser.email?.includes("manager") || false
          const branchCode = isManager ? "HQ" : firebaseUser.email?.split("@")[0] || "unknown"

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            branchCode,
            isManager,
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
