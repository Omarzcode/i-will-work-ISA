"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut, 
    GoogleAuthProvider,
    signInWithPopup,
    type User as FirebaseUser 
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  signInWithGoogle: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
          } else {
            const newUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                isManager: false, // Default for new users
                branchCode: firebaseUser.email?.split("@")[0] || "unknown",
                displayName: firebaseUser.displayName || "",
                photoURL: firebaseUser.photoURL || "",
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [])

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  }

  const logout = async () => {
    await signOut(auth);
  }

  // --- This is the fully implemented function ---
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
          isManager: false, // Default for new Google sign-ins
          branchCode: firebaseUser.email?.split("@")[0] || "unknown",
        };
        await setDoc(userDocRef, newUser);
      }
      return result;
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      throw error;
    }
  };
  // --- End of function ---

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    signInWithGoogle, // Use the real function here
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