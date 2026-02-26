"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  User,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 🔥 WAJIB untuk mobile agar session tersimpan
        await setPersistence(auth, browserLocalPersistence);

        // 🔥 Handle redirect result (flow mobile)
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect login success:", result.user);
        }

        // 🔥 Listen auth state globally
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log("Auth state changed:", user);
          setUser(user);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Auth initialization error:", error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signInWithGoogle = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(
      navigator.userAgent
    );

    try {
      if (isMobile) {
        // 🔥 Mobile pakai redirect (lebih stabil)
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Desktop pakai popup
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      console.error("Google login error:", error);

      // fallback redirect kalau popup gagal
      if (
        error.code !== "auth/popup-closed-by-user" &&
        error.code !== "auth/cancelled-popup-request" &&
        !isMobile
      ) {
        await signInWithRedirect(auth, googleProvider);
      }
    }
  };

  const logout = async () => {
    try {
      // clear local storage
      localStorage.removeItem("worshipHistory");
      localStorage.removeItem("fastingHistory");
      localStorage.removeItem("fastingStatus");

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("worshipTasks_")) {
          localStorage.removeItem(key);
        }
      });

      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};