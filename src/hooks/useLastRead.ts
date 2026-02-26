"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserData } from "@/lib/db";

export interface Bookmark {
    surahId: number;
    ayahNumber: number;
    surahName: string;
    totalAyahs?: number;
}

export function useLastRead() {
    const { user } = useAuth();
    const [bookmark, setBookmark] = useState<Bookmark | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const loadBookmark = () => {
            const saved = localStorage.getItem("quranBookmark");
            if (saved) {
                try {
                    setBookmark(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse bookmark", e);
                }
            }
        };

        loadBookmark();

        // Listen for storage events (cross-tab)
        window.addEventListener("storage", loadBookmark);

        return () => {
            window.removeEventListener("storage", loadBookmark);
        };
    }, []);

    // Sync from Firestore when user logs in
    useEffect(() => {
        if (user) {
            getUserData(user.uid).then((data) => {
                if (data && data.quranBookmark) {
                    console.log("Synced bookmark from Firestore:", data.quranBookmark);
                    setBookmark(data.quranBookmark);
                    localStorage.setItem("quranBookmark", JSON.stringify(data.quranBookmark));
                }
            }).catch(err => console.error("Failed to sync bookmark", err));
        }
    }, [user]);

    return { bookmark, mounted };
}
