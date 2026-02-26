"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, User, getRedirectResult } from "firebase/auth";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check for redirect result (crucial for mobile flow)
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    console.log("Redirect sign-in successful:", result.user);
                    // User state will be updated by onAuthStateChanged automatically
                }
            })
            .catch((error) => {
                console.error("Redirect sign-in error:", error);
            });

        // 2. Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        try {
            if (isMobile) {
                await signInWithRedirect(auth, googleProvider);
            } else {
                await signInWithPopup(auth, googleProvider);
            }
        } catch (error: any) {
            console.error("Error signing in with Google", error);

            // Only fallback to redirect if it's NOT a user cancellation/close
            // This prevents the "slow" feeling if a user just closes the popup
            if (error.code !== 'auth/popup-closed-by-user' &&
                error.code !== 'auth/cancelled-popup-request' &&
                !isMobile) {
                try {
                    await signInWithRedirect(auth, googleProvider);
                } catch (retryError) {
                    console.error("Retry with redirect failed", retryError);
                }
            }
        }
    };

    const logout = async () => {
        try {
            // Clear all app-related local storage
            localStorage.removeItem("worshipHistory");
            localStorage.removeItem("fastingHistory");
            localStorage.removeItem("fastingStatus");
            // Clear daily tasks
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith("worshipTasks_")) {
                    localStorage.removeItem(key);
                }
            });

            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
