"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPrayerTimes } from "@/lib/api";
import { PrayerData } from "@/types";
import { Loader2, MapPin, Bell, Cloud, Moon, Sun, Sunset, BookOpen, Crown, MoreHorizontal, MessageSquare, ChevronRight, Share2, Copy, Compass, ChevronDown, Search, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "./ui/button";
import WorshipTracker from "./WorshipTracker";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CheckCircle2 } from "lucide-react";
import { useLastRead } from "@/hooks/useLastRead";
import { useAuth } from "@/context/AuthContext";
import { saveUser, getUserData, syncUserData, getAllDailyLogs, saveDailyLog } from "@/lib/db";
import { LogOut, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CITIES = [
    // WIB (Waktu Indonesia Barat)
{ name: "Jakarta & Sekitarnya (WIB)", lat: -6.2088, long: 106.8456 },
{ name: "Bandung & Jawa Barat (WIB)", lat: -6.9175, long: 107.6191 },
{ name: "Yogyakarta & Jateng (WIB)", lat: -7.7956, long: 110.3695 },
{ name: "Surabaya & Jawa Timur (WIB)", lat: -7.2575, long: 112.7521 },
{ name: "Banda Aceh (WIB)", lat: 5.5483, long: 95.3238 },
{ name: "Medan & Sumut (WIB)", lat: 3.5952, long: 98.6722 },
{ name: "Padang & Sumbar (WIB)", lat: -0.9471, long: 100.4172 },
{ name: "Palembang & Sumsel (WIB)", lat: -2.9761, long: 104.7754 },
{ name: "Pontianak & Kalbar (WIB)", lat: -0.0263, long: 109.3425 },

// Tambahan Jawa Tengah (WIB)
{ name: "Kota Tegal (WIB)", lat: -6.8694, long: 109.1402 },
{ name: "Kota Pemalang (WIB)", lat: -6.8914, long: 109.3826 },
{ name: "Kota Pekalongan (WIB)", lat: -6.8886, long: 109.6753 },
{ name: "Kota Semarang (WIB)", lat: -6.9667, long: 110.4167 },

    // WITA (Waktu Indonesia Tengah)
    { name: "Bali & Nusa Tenggara (WITA)", lat: -8.6705, long: 115.2126 },
    { name: "Makassar & Sulsel (WITA)", lat: -5.1477, long: 119.4327 },
    { name: "Balikpapan & Kaltim (WITA)", lat: -1.2379, long: 116.8529 },
    { name: "Banjarmasin & Kalsel (WITA)", lat: -3.3193, long: 114.5898 },
    { name: "Manado & Sulut (WITA)", lat: 1.4748, long: 124.8421 },

    // WIT (Waktu Indonesia Timur)
    { name: "Ambon & Maluku (WIT)", lat: -3.6554, long: 128.1907 },
    { name: "Jayapura & Papua (WIT)", lat: -2.5000, long: 140.7167 },
    { name: "Merauke (WIT)", lat: -8.4900, long: 140.4000 },
];

export default function MuslimProDashboard() {
    const { bookmark, mounted } = useLastRead();
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [city, setCity] = useState("Yogyakarta & Jateng (WIB)");
    const [isMounted, setIsMounted] = useState(false);
    const [country, setCountry] = useState("Indonesia");
    const [coords, setCoords] = useState<{ lat: number; long: number } | null>({ lat: -7.7956, long: 110.3695 });
    const [searchQuery, setSearchQuery] = useState("");
    const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);

    // Load saved location on mount
    useEffect(() => {
        setIsMounted(true);
        const savedCity = localStorage.getItem("selectedCity");
        const savedCoords = localStorage.getItem("selectedCoords");
        if (savedCity && savedCoords) {
            try {
                setCity(savedCity);
                setCoords(JSON.parse(savedCoords));
            } catch (e) {
                // Ignore parse error
            }
        }
    }, []);

    // Helper to format YYYY-MM-DD
    const formatDateKey = (date: Date) => {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    };

    // Fasting Streak
    const [fastingStreak, setFastingStreak] = useState(0);
    const [isFasting, setIsFasting] = useState(false);
    const [fastingHistory, setFastingHistory] = useState<string[]>([]);

    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>("");
    const [worshipProgress, setWorshipProgress] = useState(0);
    const [worshipHistory, setWorshipHistory] = useState<Record<string, number>>({});

    useEffect(() => {
        const calculateProgress = () => {
            const today = new Date();
            const dateKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

            // Load History First
            const historyStr = localStorage.getItem("worshipHistory");
            let history: Record<string, number> = {};

            if (historyStr) {
                try {
                    history = JSON.parse(historyStr);
                    setWorshipHistory(history);
                } catch (e) {
                    console.error("Failed to parse worship history", e);
                }
            } else {
                setWorshipHistory({});
            }

            // Robust History Build: Scan localStorage for ANY worshipTasks_* keys
            // This ensures heatmap is correct even if worshipHistory object is out-of-sync
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith("worshipTasks_")) {
                    const dKey = key.replace("worshipTasks_", "");
                    try {
                        const tasks = JSON.parse(localStorage.getItem(key) || "[]");
                        if (Array.isArray(tasks) && tasks.length > 0) {
                            const completed = tasks.filter((t: any) => t.completed).length;
                            const calcProgress = Math.round((completed / tasks.length) * 100);
                            // Only update if it's missing or lower (so we don't downgrade history accidentally, though tasks is source of truth)
                            if (history[dKey] === undefined || history[dKey] !== calcProgress) {
                                history[dKey] = calcProgress;
                            }
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }

            // Save the reinforced history
            localStorage.setItem("worshipHistory", JSON.stringify(history));
            setWorshipHistory(history);

            // Calculate Today's Progress
            // Priority 1: Check history for today
            if (history[dateKey] !== undefined) {
                setWorshipProgress(history[dateKey]);
            }
            // Priority 2: Check today's specific task list (fallback)
            else {
                const savedTasks = localStorage.getItem(`worshipTasks_${dateKey}`);
                if (savedTasks) {
                    try {
                        const tasks = JSON.parse(savedTasks);
                        if (Array.isArray(tasks) && tasks.length > 0) {
                            const completed = tasks.filter((t: any) => t.completed).length;
                            setWorshipProgress(Math.round((completed / tasks.length) * 100));
                        } else {
                            setWorshipProgress(0);
                        }
                    } catch (e) {
                        setWorshipProgress(0);
                    }
                } else {
                    setWorshipProgress(0);
                }
            }
        };

        calculateProgress();

        // Listen for custom event from WorshipTracker instead of polling
        const handleWorshipUpdate = () => calculateProgress();
        window.addEventListener('worshipProgressUpdated', handleWorshipUpdate);

        return () => window.removeEventListener('worshipProgressUpdated', handleWorshipUpdate);
    }, []);

    useEffect(() => {
        // Load Fasting History
        const savedHistory = localStorage.getItem("fastingHistory");
        const todayKey = formatDateKey(new Date());

        if (savedHistory) {
            const history = JSON.parse(savedHistory);
            setFastingHistory(history);
            setIsFasting(history.includes(todayKey));

            // Calculate Streak
            let streak = 0;
            const dates = [...new Set(history)].sort().reverse() as string[];

            if (dates.length > 0) {
                const today = new Date();
                let checkDate = new Date(today);
                const todayStr = formatDateKey(checkDate);
                checkDate.setDate(checkDate.getDate() - 1);
                const yesterdayStr = formatDateKey(checkDate);

                if (history.includes(todayStr)) {
                    streak = 1;
                    let current = new Date(today);
                    while (true) {
                        current.setDate(current.getDate() - 1);
                        const dateStr = formatDateKey(current);
                        if (history.includes(dateStr)) {
                            streak++;
                        } else {
                            break;
                        }
                    }
                } else if (history.includes(yesterdayStr)) {
                    streak = 0;
                    let current = new Date(today);
                    while (true) {
                        current.setDate(current.getDate() - 1);
                        const dateStr = formatDateKey(current);
                        if (history.includes(dateStr)) {
                            streak++;
                        } else {
                            break;
                        }
                    }
                }
            }
            setFastingStreak(streak);
        }
    }, []);

    const { user, signInWithGoogle, logout } = useAuth();

    // Sync Data on Login
    useEffect(() => {
        const syncData = async () => {
            if (user) {
                // 1. Ensure user exists in DB
                await saveUser({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                });

                // 2 & 3. Fetch latest data from DB and Merge with Local
                const userData = await getUserData(user.uid);
                const allDailyLogs = await getAllDailyLogs(user.uid);

                let mergedWorshipHistory: Record<string, number> = {};
                if (userData && userData.worshipHistory) {
                    mergedWorshipHistory = { ...userData.worshipHistory };
                }

                let mergedFastingHistory: string[] = [];
                if (userData && userData.fastingHistory) {
                    mergedFastingHistory = [...userData.fastingHistory];
                }

                let hasLocalChanges = false;

                // RECONSTRUCT MISSING SUMMARIES (From past bugs where worshipHistory wasn't saved to user doc)
                // This guarantees that past dates are always included in the heatmap.
                if (allDailyLogs && allDailyLogs.length > 0) {
                    allDailyLogs.forEach(log => {
                        const dKey = log.id;
                        // Use highest progress
                        if (log.progress !== undefined) {
                            if (mergedWorshipHistory[dKey] === undefined || log.progress > mergedWorshipHistory[dKey]) {
                                mergedWorshipHistory[dKey] = log.progress;
                                hasLocalChanges = true;
                            }
                        }
                        // Guarantee local storage has the granular tasks
                        if (log.tasks) {
                            const storageKey = `worshipTasks_${dKey}`;
                            // Don't overwrite if local has MORE completed tasks than remote (local is always right immediately after clicking, until merged)
                            // Actually here we just set it if it doesn't exist to allow offline viewing
                            if (!localStorage.getItem(storageKey)) {
                                localStorage.setItem(storageKey, JSON.stringify(log.tasks));
                            }
                        }
                    });
                }

                // Get local data
                const localWorshipStr = localStorage.getItem("worshipHistory");
                const localFastingStr = localStorage.getItem("fastingHistory");

                if (localWorshipStr) {
                    const localWorship = JSON.parse(localWorshipStr);
                    // Merge local worship into DB worship (local overrides DB for the same date if logged locally before sync)
                    Object.keys(localWorship).forEach(date => {
                        if (!mergedWorshipHistory[date] || localWorship[date] > mergedWorshipHistory[date]) {
                            mergedWorshipHistory[date] = localWorship[date];
                            hasLocalChanges = true;
                        }
                    });
                }

                if (localFastingStr) {
                    const localFasting = JSON.parse(localFastingStr);
                    // Merge local fasting dates
                    localFasting.forEach((date: string) => {
                        if (!mergedFastingHistory.includes(date)) {
                            mergedFastingHistory.push(date);
                            hasLocalChanges = true;
                        }
                    });
                }

                // Push orphaned granular tasks to DB
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith("worshipTasks_")) {
                        const dKey = key.replace("worshipTasks_", "");
                        try {
                            const tasksStr = localStorage.getItem(key);
                            if (tasksStr) {
                                const tasks = JSON.parse(tasksStr);
                                const completed = tasks.filter((t: any) => t.completed).length;
                                const progress = Math.round((completed / tasks.length) * 100);

                                // Push to DB if local progress is strictly greater (meaning they did something offline)
                                // Or if it doesn't exist in DB at all
                                const remoteLog = allDailyLogs.find(l => l.id === dKey);
                                const shouldPush = !remoteLog || (remoteLog.progress === undefined) || (progress > remoteLog.progress);

                                if (shouldPush && progress > 0) {
                                    await saveDailyLog(user.uid, dKey, {
                                        tasks: tasks,
                                        progress: progress,
                                        updatedAt: new Date().toISOString()
                                    });
                                    mergedWorshipHistory[dKey] = progress;
                                    hasLocalChanges = true;
                                }
                            }
                        } catch (e) {
                            // ignore parse err
                        }
                    }
                }

                // Recalculate Streak using unified logic
                const todayKey = formatDateKey(new Date());
                let streak = 0;
                if (mergedFastingHistory.includes(todayKey)) {
                    streak = 1;
                    let current = new Date();
                    while (true) {
                        current.setDate(current.getDate() - 1);
                        const dateStr = formatDateKey(current);
                        if (mergedFastingHistory.includes(dateStr)) streak++; else break;
                    }
                } else {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = formatDateKey(yesterday);
                    if (mergedFastingHistory.includes(yesterdayStr)) {
                        streak = 0;
                        let current = new Date();
                        while (true) {
                            current.setDate(current.getDate() - 1);
                            const dateStr = formatDateKey(current);
                            if (mergedFastingHistory.includes(dateStr)) streak++; else break;
                        }
                    }
                }
                setFastingStreak(streak);

                // If we merged and found local data that wasn't in DB, push the update
                // Or if streak doesn't match db
                if (hasLocalChanges || (userData && userData.fastingStreak !== streak)) {
                    await syncUserData(user.uid, {
                        worshipHistory: mergedWorshipHistory,
                        fastingHistory: mergedFastingHistory,
                        fastingStreak: streak
                    });
                }

                // 4. Update UI and LocalStorage with the fully merged state
                setWorshipHistory(mergedWorshipHistory);
                localStorage.setItem("worshipHistory", JSON.stringify(mergedWorshipHistory));

                // Explicitly set today's progress to update the Daily Tracker UI immediately
                if (mergedWorshipHistory[todayKey] !== undefined) {
                    setWorshipProgress(mergedWorshipHistory[todayKey]);
                } else {
                    setWorshipProgress(0); // Reset or let calculateProgress handle it later
                }

                setFastingHistory(mergedFastingHistory);
                localStorage.setItem("fastingHistory", JSON.stringify(mergedFastingHistory));

                setIsFasting(mergedFastingHistory.includes(todayKey));
            } else {
                // User logged out: Reset to local data (which is cleared on logout)
                setWorshipHistory({});
                setFastingHistory([]);
                setFastingStreak(0);
                setIsFasting(false);
                setWorshipProgress(0);
            }
        };

        syncData();
    }, [user]);

    const handleFastingToggle = (checked: boolean, dateKey?: string) => {
        const targetDateKey = dateKey || formatDateKey(new Date());
        let newHistory = [...fastingHistory];

        if (checked) {
            if (!newHistory.includes(targetDateKey)) {
                newHistory.push(targetDateKey);
            }
        } else {
            newHistory = newHistory.filter(d => d !== targetDateKey);
        }

        setFastingHistory(newHistory);
        // setIsFasting is only for TODAY's visual in Dashboard. Check if target is today.
        const todayKey = formatDateKey(new Date());
        if (targetDateKey === todayKey) {
            setIsFasting(checked);
            localStorage.setItem("fastingStatus", String(checked));
        }

        localStorage.setItem("fastingHistory", JSON.stringify(newHistory));

        let streak = 0;
        // Sort history to ensure correct streak calc
        const sortedHistory = [...newHistory].sort().reverse(); // Descending dates

        // Use consistent streak logic: count backwards from today (or yesterday if missed today)
        if (sortedHistory.length > 0) {
            let checkDate = new Date(); // Today
            let checkDateStr = formatDateKey(checkDate);

            // If today is fasted, start counting from today
            // If today is NOT fasted, check yesterday. If yesterday fasted, start counting from yesterday.
            if (newHistory.includes(checkDateStr)) {
                streak = 0; // Will increment in loop
                let current = new Date();
                while (true) {
                    const dStr = formatDateKey(current);
                    if (newHistory.includes(dStr)) {
                        streak++;
                        current.setDate(current.getDate() - 1);
                    } else {
                        break;
                    }
                }
            } else {
                // Check yesterday
                checkDate.setDate(checkDate.getDate() - 1);
                const yesterdayStr = formatDateKey(checkDate);
                if (newHistory.includes(yesterdayStr)) {
                    streak = 0;
                    let current = new Date();
                    current.setDate(current.getDate() - 1); // Start from yesterday
                    while (true) {
                        const dStr = formatDateKey(current);
                        if (newHistory.includes(dStr)) {
                            streak++;
                            current.setDate(current.getDate() - 1);
                        } else {
                            break;
                        }
                    }
                }
            }
        }
        setFastingStreak(streak);

        // Sync with DB if logged in
        if (user) {
            syncUserData(user.uid, { fastingHistory: newHistory, fastingStreak: streak });
        }
    };

    /*
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCoords({ lat: latitude, long: longitude });
                    setCity("Locating...");
                },
                (error) => {
                    console.error("Geolocation error:", error);
                }
            );
        }
    }, []);
    */

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const data = await getPrayerTimes(city, country, coords?.lat, coords?.long);
            setPrayerData(data);

            /*
            // Reverse Geocode to get the real city name
            if (coords) {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.long}`);
                    const locationData = await res.json();
                    // Try to find the most relevant city name
                    const realCity = locationData.address.city ||
                        locationData.address.town ||
                        locationData.address.village ||
                        locationData.address.county ||
                        "My Location";
                    setCity(realCity);
                } catch (e) {
                    console.error("Reverse geocoding failed", e);
                    setCity("My Location");
                }
            }
            */

            setLoading(false);
        }
        fetchData();
    }, [country, coords]); // removed 'city' dependency to avoid loop if we setCity inside

    useEffect(() => {
        if (!prayerData) return;

        const updateTimer = () => {
            const now = new Date();
            const timings = prayerData.timings;
            const prayerList = [
                { name: "Imsak", time: timings.Imsak },
                { name: "Fajr", time: timings.Fajr },
                { name: "Dhuhr", time: timings.Dhuhr },
                { name: "Asr", time: timings.Asr },
                { name: "Maghrib", time: timings.Maghrib },
                { name: "Isha", time: timings.Isha },
            ];

            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
            let upcoming = null;

            for (const prayer of prayerList) {
                const [h, m] = prayer.time.split(":").map(Number);
                const prayerTimeMinutes = h * 60 + m;
                if (prayerTimeMinutes > currentTimeMinutes) {
                    upcoming = prayer;
                    break;
                }
            }
            if (!upcoming) upcoming = prayerList[0];
            setNextPrayer(upcoming);

            const [h, m] = upcoming.time.split(":").map(Number);
            let diff = (h * 60 + m) - currentTimeMinutes;
            if (diff < 0) diff += 24 * 60;

            const hours = Math.floor(diff / 60);
            const mins = diff % 60;

            setTimeRemaining(`${hours}h ${mins}m`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [prayerData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!prayerData) return <div>Failed to load</div>;

    const features = [
        { name: "Quran", icon: BookOpen, href: "/quran" },
        { name: "Dua", icon: MessageSquare, href: "/dua" },
        { name: "Tasbih", icon: MoreHorizontal, href: "/tasbih" },
        { name: "Qibla", icon: Compass, href: "/qibla" },
        { name: "Recap", icon: Sparkles, href: "/recap" },
    ];

    return (
        <div className="w-full min-h-screen bg-slate-50 text-slate-800 pb-24">

            {/* Organic Fluid Hero Section */}
            <div className="relative bg-gradient-to-br from-[#4c1d95] via-[#6d28d9] to-[#8b5cf6] text-white rounded-b-[48px] shadow-2xl overflow-hidden mb-6 relative z-10">
                {/* Decorative Elements (Restored & Enhanced) */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/20 rounded-full blur-[80px]"></div>

                {/* Islamic Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>

                {/* Moon Ornament */}
                <div className="absolute top-20 right-[-10px] opacity-10 transform rotate-12 pointer-events-none">
                    <Moon className="w-48 h-48 text-white" />
                </div>

                {/* Content Wrapper */}
                <div className="relative z-10 px-6 pt-14 pb-12 max-w-5xl mx-auto">

                    {/* Top Bar: Date & Location & User */}
                    <div className="flex justify-between items-start mb-12">
                        {/* Left: Date & Location */}
                        <div className="flex flex-col gap-1 min-w-0 flex-1 pr-4">
                            <p className="text-[10px] sm:text-xs font-bold text-violet-200/80 uppercase tracking-widest truncate">
                                {prayerData.date.hijri.day} {prayerData.date.hijri.month.en} {prayerData.date.hijri.year}
                            </p>

                            <Sheet open={isLocationSheetOpen} onOpenChange={setIsLocationSheetOpen}>
                                <SheetTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer group origin-left transition-transform hover:scale-105 w-full">
                                        <MapPin className="w-4 h-4 text-amber-400 drop-shadow-md shrink-0" />
                                        <span className="text-base sm:text-lg font-bold text-white group-hover:text-amber-100 transition-colors truncate">
                                            {isMounted ? city : "Yogyakarta & Jateng (WIB)"}
                                        </span>
                                        <ChevronDown className="w-3 h-3 text-white/50 shrink-0" />
                                    </div>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="rounded-t-[30px] h-[70vh] p-0 bg-background border-t border-border focus:outline-none">
                                    <div className="p-6 pb-2">
                                        <SheetHeader className="mb-4 text-left">
                                            <SheetTitle className="text-xl font-bold text-foreground">Select Location</SheetTitle>
                                        </SheetHeader>
                                        <div className="relative mb-4">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search city..."
                                                className="w-full bg-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto h-full pb-32 px-2">
                                        {CITIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((c) => (
                                            <div
                                                key={c.name}
                                                className={`flex items-center justify-between p-4 mx-2 rounded-xl cursor-pointer transition-colors ${city === c.name ? "bg-violet-50" : "hover:bg-slate-50"}`}
                                                onClick={() => {
                                                    setCity(c.name);
                                                    setCoords({ lat: c.lat, long: c.long });
                                                    localStorage.setItem("selectedCity", c.name);
                                                    localStorage.setItem("selectedCoords", JSON.stringify({ lat: c.lat, long: c.long }));
                                                    setIsLocationSheetOpen(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${city === c.name ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-400"}`}>
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <span className={`text-sm font-medium ${city === c.name ? "text-violet-700" : "text-slate-700"}`}>{c.name}</span>
                                                </div>
                                                {city === c.name && <CheckCircle2 className="w-5 h-5 text-violet-600" />}
                                            </div>
                                        ))}
                                        {CITIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                            <div className="text-center py-8 text-slate-400 text-sm">
                                                City not found
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Right: Profile & Streak Capsule */}
                        <div className="flex items-center gap-3 shrink-0">
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className="flex items-center gap-3 bg-white/10 pl-1.5 pr-5 py-1.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-pointer group shadow-lg shadow-purple-900/10">
                                            <Avatar className="h-10 w-10 border-2 border-white/20 group-hover:border-amber-400 transition-colors">
                                                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                                                <AvatarFallback className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-sm">
                                                    {user.displayName?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col items-start">
                                                <p className="text-sm font-bold text-white leading-none mb-1 shadow-sm">{user.displayName?.split(' ')[0]}</p>
                                                <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full">
                                                    <span className="text-[10px] animate-pulse">🔥</span>
                                                    <span className="text-[10px] font-bold text-amber-300 tracking-wide">{fastingStreak} Streak</span>
                                                </div>
                                            </div>
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div
                                    onClick={signInWithGoogle}
                                    className="flex items-center gap-3 bg-white/10 pl-1.5 pr-5 py-1.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-pointer group shadow-lg"
                                >
                                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/10 group-hover:border-white/30 transition-colors">
                                        <UserIcon className="w-5 h-5 text-white/80" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <p className="text-sm font-bold text-white leading-none mb-1">Login</p>
                                        <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full">
                                            <span className="text-[10px] text-white/50">🔥</span>
                                            <span className="text-[10px] font-bold text-amber-300/80 tracking-wide">{fastingStreak} Streak</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Focus: Countdown */}
                    <div className="text-center mb-14 relative">
                        {/* Glow behind countdown */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-violet-500/30 rounded-full blur-3xl -z-10"></div>

                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                            <span className="text-xs font-medium text-violet-100 tracking-wide uppercase">
                                {nextPrayer?.name === 'Imsak' ? 'Waktu Imsak Dalam' : `Menuju ${nextPrayer?.name}`}
                            </span>
                        </div>

                        <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter tabular-nums leading-none drop-shadow-2xl mb-2 animate-in fade-in zoom-in-50 duration-1000">
                            {timeRemaining}
                        </h1>
                        <p className="text-lg font-medium text-violet-200/70">
                            {nextPrayer?.time}
                        </p>
                    </div>

                    {/* Prayer Time Strip */}
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2 border border-white/10 shadow-2xl mx-auto overflow-x-auto">
                        <div className="flex justify-between items-center min-w-[300px]">
                            {['Imsak', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => {
                                const time = prayerData.timings[name as keyof typeof prayerData.timings];
                                const isNext = nextPrayer?.name === name;

                                return (
                                    <div
                                        key={name}
                                        className={`
                                            flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300 relative group
                                            ${isNext ? 'bg-white/10 scale-105 z-10' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}
                                        `}
                                    >
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isNext ? 'text-amber-300' : 'text-violet-300'}`}>{name}</span>
                                        <span className={`text-xs font-bold ${isNext ? 'text-white scale-110' : 'text-white'}`}>{time}</span>

                                        {/* Active Indicator Dot */}
                                        <div className={`w-1 h-1 rounded-full transition-all ${isNext ? 'bg-amber-400 opacity-100' : 'bg-transparent opacity-0'}`}></div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* Features Menu - Overlapping & Premium */}
            <div className="px-6 -mt-8 relative z-20 mb-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-[24px] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 mx-auto">
                    <div className="flex justify-between items-center px-2">
                        {features.map((feature, i) => (
                            <Link key={i} href={feature.href} className="flex flex-col items-center gap-2 group cursor-pointer">
                                <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                                    <feature.icon className="w-5 h-5 text-violet-600" />
                                </div>
                                <span className="text-[10px] font-medium text-slate-600 group-hover:text-violet-600 transition-colors">{feature.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            {/* Content Body */}
            {/* Content Body */}
            <div className="px-5 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">

                {/* Column 1: Action Items */}
                <div className="flex flex-col gap-6 h-full">
                    {/* Worship Tracker Entry Point */}
                    <div className="flex-1">
                        <Sheet>
                            <SheetTrigger asChild>
                                <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 cursor-pointer active:scale-95 transition-transform group border border-transparent hover:border-violet-100 h-full flex flex-col justify-center">
                                    <div className="w-full flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform shrink-0">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <h3 className="text-base font-bold text-slate-800">Daily Tracker</h3>
                                                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                                                    {worshipProgress}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-violet-600 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${worshipProgress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1.5">Track prayers & sunnah</p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-violet-600 font-bold text-xs hover:bg-violet-50 shrink-0">
                                            Open
                                        </Button>
                                    </div>
                                </div>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="rounded-t-[30px] h-[80vh] p-0 bg-background border-t border-border">
                                <div className="p-6 pb-0">
                                    <SheetHeader className="mb-4 text-left">
                                        <SheetTitle className="text-xl font-bold text-foreground">Daily Worship & Activity</SheetTitle>
                                    </SheetHeader>
                                </div>
                                <div className="overflow-y-auto h-full pb-20 px-0">
                                    <WorshipTracker
                                        fastingHistory={fastingHistory}
                                        onFastingChange={handleFastingToggle}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Quran Progress */}
                    {mounted && (
                        <Link href={bookmark ? `/quran/${bookmark.surahId}#ayah-${bookmark.ayahNumber}` : "/quran/1"} className="block flex-1">
                            <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-3xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all h-full flex flex-col justify-center">
                                <div className="w-full flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-violet-100">
                                        <BookOpen className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800 text-sm">
                                            {bookmark ? "Continue Reading" : "Start Reading"}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {bookmark ? `${bookmark.surahName}, Ayah ${bookmark.ayahNumber}` : "Al-Fatiha, The Opening"}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-600 transition-colors" />
                                </div>
                            </div>
                        </Link>
                    )}
                </div>

                {/* Column 2: Inspiration */}
                <div>
                    <div className="bg-gradient-to-br from-fuchsia-500 to-violet-600 rounded-[28px] p-6 text-white shadow-lg relative overflow-hidden transition-all h-full flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 opacity-90">
                                <Crown className="w-5 h-5 text-amber-300" />
                                <span className="text-xs font-bold uppercase tracking-wider">Verse of the Day</span>
                            </div>
                            <blockquote className="text-xl md:text-2xl font-medium leading-relaxed mb-6 font-serif">
                                "Indeed, with hardship [will be] ease."
                            </blockquote>
                            <div className="flex justify-between items-end">
                                <p className="text-sm opacity-80 font-medium">Surah Al-Sharh, 94:6</p>
                                <div className="flex gap-2">
                                    <Button size="icon" className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white border-0 transition-colors">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white border-0 transition-colors">
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: Stats/Heatmap */}
                <div className="md:col-span-2 xl:col-span-1">
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-slate-800">Ramadan Consistency</h3>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Ramadan 1447H</span>
                        </div>

                        <div className="flex flex-col gap-4 items-center justify-center h-full pb-4 main-heatmap-container">
                            <div className="grid grid-cols-6 gap-3">
                                {Array.from({ length: 30 }).map((_, i) => {
                                    // 1 Ramadan 1447H approx. Feb 19, 2026 (User preference)
                                    const startDate = new Date('2026-02-19');
                                    const date = new Date(startDate);
                                    date.setDate(startDate.getDate() + i);

                                    const dateKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');

                                    const today = new Date();
                                    const isToday = date.getDate() === today.getDate() &&
                                        date.getMonth() === today.getMonth() &&
                                        date.getFullYear() === today.getFullYear();

                                    const isFuture = date > today && !isToday;

                                    const value = isToday ? worshipProgress : (worshipHistory[dateKey] || 0);

                                    let colorClass = "bg-slate-200";
                                    if (value > 0) colorClass = "bg-violet-200";
                                    if (value >= 40) colorClass = "bg-violet-400";
                                    if (value >= 70) colorClass = "bg-violet-600 shadow-sm";
                                    if (value === 100) colorClass = "bg-violet-800 shadow-md ring-1 ring-violet-900/20";

                                    // Visual distinction for future dates
                                    if (isFuture) colorClass = "bg-slate-50 border border-slate-100 opacity-60";

                                    // Visual distinction for Today
                                    const borderClass = isToday ? "ring-2 ring-violet-400 ring-offset-1" : "";

                                    return (
                                        <div
                                            key={i}
                                            className={`w-8 h-8 rounded-lg ${colorClass} ${borderClass} transition-all hover:scale-110 cursor-pointer relative group`}
                                        >
                                            {!isFuture && (
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity shadow-lg">
                                                    {date.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}: {value}%
                                                </div>
                                            )}
                                            {isFuture && (
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-100 text-slate-400 text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity shadow-sm border border-slate-200">
                                                    {date.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 w-full px-4">
                                <span>Less</span>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-sm bg-slate-200"></div>
                                    <div className="w-3 h-3 rounded-sm bg-violet-200"></div>
                                    <div className="w-3 h-3 rounded-sm bg-violet-400"></div>
                                    <div className="w-3 h-3 rounded-sm bg-violet-600"></div>
                                    <div className="w-3 h-3 rounded-sm bg-violet-800"></div>
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Worship Tracker Entry Point */}

        </div>
    );
}
