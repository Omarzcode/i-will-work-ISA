"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          console.log("Auth state changed - user logged in:", firebaseUser.email)

          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

          if (userDoc.exists()) {
            const userData = userDoc.data()
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              branchCode: userData.branchCode || "",
              isManager: userData.isManager || false,
            }
            console.log("User data loaded:", user)
            setUser(user)
          } else {
            console.log("User document not found, creating default user")
            // Create default user document if it doesn't exist
            const defaultUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              branchCode: "001", // Default branch
              isManager: false,
            }

            await setDoc(doc(db, "users", firebaseUser.uid), {
              email: defaultUser.email,
              branchCode: defaultUser.branchCode,
              isManager: defaultUser.isManager,
            })

            setUser(defaultUser)
          }
        } catch (error) {
          console.error("Error loading user data:", error)
          setUser(null)
        }
      } else {
        console.log("Auth state changed - user logged out")
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email)
      await signInWithEmailAndPassword(auth, email, password)
      console.log("Login successful")
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log("Logging out user")
      await signOut(auth)
      setUser(null)
      console.log("Logout successful")
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
