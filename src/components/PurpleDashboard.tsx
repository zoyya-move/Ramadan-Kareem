"use client";

import { useEffect, useState } from "react";
import { getPrayerTimes } from "@/lib/api";
import { PrayerData } from "@/types";
import { Loader2, MapPin, Bell, Cloud, Moon, Sun, Sunset } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import WorshipTracker from "./WorshipTracker";
import { Button } from "./ui/button";

export default function PurpleDashboard() {
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [city, setCity] = useState("Jakarta");
    const [country, setCountry] = useState("Indonesia");
    const [coords, setCoords] = useState<{ lat: number; long: number } | null>(null);

    // Fasting Streak
    const [fastingStreak, setFastingStreak] = useState(0);
    const [isFasting, setIsFasting] = useState(false);
    const [fastingHistory, setFastingHistory] = useState<string[]>([]);

    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>("");

    // Geolocation & Fetch Data
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCoords({ lat: latitude, long: longitude });
                    setCity("My Location"); // Or reverse geocode if needed
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    // Fallback to Jakarta is already default
                }
            );
        }
    }, []);

    useEffect(() => {
        // Load Fasting History
        const savedHistory = localStorage.getItem("fastingHistory");
        const todayKey = new Date().toISOString().split('T')[0];

        if (savedHistory) {
            const history = JSON.parse(savedHistory);
            setFastingHistory(history);
            setIsFasting(history.includes(todayKey));

            // Calculate Streak
            let streak = 0;
            // distinct dates, sorted desc
            const dates = [...new Set(history)].sort().reverse() as string[];

            // Check if today is present
            if (dates.length > 0) {
                const today = new Date();
                // Check consecutive dates backward
                let checkDate = new Date(today);

                // If today is marked, start counting
                // If not, maybe check yesterday? 
                // Standard apps usually count streak if yesterday was done, and today is pending or done.
                // Let's count actual marked days continuously from today or yesterday.

                // Logic: 
                // 1. If today is marked -> Streak starts from today backwards.
                // 2. If today is NOT marked -> Streak is present IF yesterday was marked.

                const todayStr = checkDate.toISOString().split('T')[0];
                checkDate.setDate(checkDate.getDate() - 1);
                const yesterdayStr = checkDate.toISOString().split('T')[0];

                if (history.includes(todayStr)) {
                    streak = 1;
                    let current = new Date(today);
                    while (true) {
                        current.setDate(current.getDate() - 1);
                        const dateStr = current.toISOString().split('T')[0];
                        if (history.includes(dateStr)) {
                            streak++;
                        } else {
                            break;
                        }
                    }
                } else if (history.includes(yesterdayStr)) {
                    // Start from yesterday
                    streak = 0;
                    let current = new Date(today); // Start from today
                    while (true) {
                        current.setDate(current.getDate() - 1); // First step goes to yesterday
                        const dateStr = current.toISOString().split('T')[0];
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

    const handleFastingToggle = (checked: boolean, date?: string) => {
        // Use local date for default
        const now = new Date();
        const localTodayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const todayKey = date || localTodayKey;

        let newHistory = [...fastingHistory];

        if (checked) {
            if (!newHistory.includes(todayKey)) {
                newHistory.push(todayKey);
            }
        } else {
            newHistory = newHistory.filter(d => d !== todayKey);
        }

        setFastingHistory(newHistory);
        const actualToday = new Date().toISOString().split('T')[0];
        if (todayKey === actualToday) {
            setIsFasting(checked);
            localStorage.setItem("fastingStatus", String(checked));
        }

        localStorage.setItem("fastingHistory", JSON.stringify(newHistory));

        // Recalculate Streak immediately
        let streak = 0;
        if (checked) {
            streak = 1;
            let current = new Date();
            while (true) {
                current.setDate(current.getDate() - 1);
                const dateStr = current.toISOString().split('T')[0];
                if (newHistory.includes(dateStr)) {
                    streak++;
                } else {
                    break;
                }
            }
        } else {
            // If unchecked today, check if yesterday exists
            let current = new Date();
            current.setDate(current.getDate() - 1); // Yesterday
            const yesterdayStr = current.toISOString().split('T')[0];

            if (newHistory.includes(yesterdayStr)) {
                while (true) {
                    const dateStr = current.toISOString().split('T')[0];
                    if (newHistory.includes(dateStr)) {
                        streak++;
                        current.setDate(current.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }
        }
        setFastingStreak(streak);
    };

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const data = await getPrayerTimes(city, country, coords?.lat, coords?.long);
            setPrayerData(data);
            // If we have coords, we could try to get a better name from meta, but Aladhan meta isn't great for that.
            if (data && data.meta && data.meta.timezone) {
                // Maybe use timezone as proxy for location name if "My Location" is too generic?
                // For now "My Location" or specific city/country if fallback is fine.
            }
            setLoading(false);
        }
        fetchData();
    }, [city, country, coords]);

    // Timer Logic
    useEffect(() => {
        if (!prayerData) return;

        const updateTimer = () => {
            const now = new Date();
            const timings = prayerData.timings;
            const prayerList = [
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
            if (!upcoming) upcoming = prayerList[0]; // Next day Fajr
            setNextPrayer(upcoming);

            // Calculate remaining time
            const [h, m] = upcoming.time.split(":").map(Number);
            let diff = (h * 60 + m) - currentTimeMinutes;
            if (diff < 0) diff += 24 * 60; // Next day

            const hours = Math.floor(diff / 60);
            const mins = diff % 60;
            const secs = 59 - now.getSeconds(); // Approx

            setTimeRemaining(`${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
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

    const prayerIcons = {
        Fajr: Cloud, // Mist/Dawn
        Dhuhr: Sun,
        Asr: Sun,
        Maghrib: Sunset,
        Isha: Moon
    }

    return (
        <div className="w-full min-h-screen bg-slate-50 relative pb-24">
            {/* Fullscreen Hero Section */}
            <div className="relative bg-[#4c1d95] text-white overflow-hidden rounded-b-[2.5rem] shadow-2xl z-10">
                {/* Background Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4c1d95] via-[#6d28d9] to-[#8b5cf6]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 mix-blend-overlay"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl -ml-20 -mb-20 mix-blend-color-dodge"></div>

                {/* Moon Ornament (Restored) */}
                <div className="absolute top-20 right-[-20px] opacity-10 transform rotate-12 pointer-events-none">
                    <Moon className="w-64 h-64 text-white" />
                </div>

                {/* Content Wrapper */}
                <div className="relative z-20 px-6 pt-12 pb-6 flex flex-col items-center justify-between min-h-[55vh]">

                    {/* Header Info */}
                    <div className="w-full flex justify-between items-start mb-2">
                        <div>
                            <span className="inline-block text-[10px] font-bold tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full mb-2 backdrop-blur-md border border-white/5">
                                {prayerData.date.hijri.day} {prayerData.date.hijri.month.en}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Streak Toggle */}
                            <div
                                onClick={() => handleFastingToggle(!isFasting)}
                                className={`flex items-center gap-1.5 h-9 px-3 rounded-full backdrop-blur-md border transition-all cursor-pointer active:scale-95 group ${isFasting
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400 text-white shadow-lg shadow-orange-900/20"
                                    : "bg-white/10 border-white/10 text-violet-200 hover:bg-white/20 hover:border-white/20"
                                    }`}
                            >
                                <span className={`text-[12px] transition-transform group-hover:scale-110 ${isFasting ? "animate-pulse" : "grayscale opacity-70"}`}>🔥</span>
                                <span className="text-[11px] font-bold">
                                    {isFasting ? `${fastingStreak}` : "Fast"}
                                </span>
                            </div>

                            {/* Location Pill */}
                            <div className="flex items-center gap-1.5 h-9 bg-indigo-950/30 px-3 rounded-full backdrop-blur-md border border-white/5 hover:bg-indigo-900/40 transition-colors">
                                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-[11px] font-medium text-white">{city}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Countdown (Center Stage) */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center mb-4">
                        <div className="mb-2 relative">
                            <div className="absolute -inset-4 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                            <h2 className="relative text-7xl font-black tracking-tighter drop-shadow-2xl">
                                {timeRemaining}
                            </h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <p className="text-lg font-medium text-indigo-100">Upcoming: <span className="text-white font-bold">{nextPrayer?.name}</span></p>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            <p className="text-lg font-mono text-indigo-100">{nextPrayer?.time}</p>
                        </div>
                    </div>

                    {/* Glassmorphism Prayer Strip (Bottom of Hero) */}
                    <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-lg">
                        <div className="flex justify-between items-end">
                            {Object.entries(prayerData.timings).map(([name, time]) => {
                                if (['Sunrise', 'Sunset', 'Midnight', 'Imsak', 'Firstthird', 'Lastthird'].includes(name)) return null;

                                const isNext = nextPrayer?.name === name;
                                const Icon = prayerIcons[name as keyof typeof prayerIcons] || Sun;

                                return (
                                    <div key={name} className={`flex flex-col items-center gap-2 transition-all duration-300 ${isNext ? '-translate-y-1' : 'opacity-50'}`}>
                                        <div className={`p-2 rounded-xl transition-all ${isNext ? 'bg-amber-400 text-indigo-950 shadow-lg scale-110' : 'text-white'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase font-bold tracking-wider">{name}</p>
                                            <p className="text-[10px] font-medium">{time}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Below Hero (Sliding Up) */}
            <div className="px-5 -mt-6 relative z-30">
                {/* Tabs */}
                <div className="flex justify-center gap-2 mb-6">
                    <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800 px-6 shadow-lg shadow-slate-200">Today</Button>
                    <Button variant="ghost" className="rounded-full bg-white text-slate-500 shadow-sm hover:text-primary">Upcoming</Button>
                </div>

                <WorshipTracker
                    fastingHistory={fastingHistory}
                    onFastingChange={handleFastingToggle}
                />
            </div>
        </div>
    );
}
