"use client";

import { useEffect, useState } from "react";
import { getPrayerTimes } from "@/lib/api";
import { PrayerData } from "@/types";
import HeroCards from "./HeroCards";
import InfoRow from "./InfoRow";
import PrayerList from "./PrayerList";
import SunInfoRow from "./SunInfoRow";
import { Loader2, MapPin } from "lucide-react";

export default function DashboardLayout() {
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [city, setCity] = useState("Jakarta");
    const [country, setCountry] = useState("Indonesia");

    // State for time tracking
    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
    const [currentPrayer, setCurrentPrayer] = useState<{ name: string; time: string; endTime: string } | null>(null);
    const [timeRemaining, setTimeRemaining] = useState("");
    const [currentTimeString, setCurrentTimeString] = useState("");

    // Fetch Data
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const data = await getPrayerTimes(city, country);
            setPrayerData(data);
            setLoading(false);
        }
        fetchData();
    }, [city, country]);

    // Timer Logic & Prayer Calculation
    useEffect(() => {
        if (!prayerData) return;

        const updateTimer = () => {
            const now = new Date();
            setCurrentTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

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
            let current = null;

            // Find next prayer
            for (let i = 0; i < prayerList.length; i++) {
                const prayer = prayerList[i];
                const [h, m] = prayer.time.split(":").map(Number);
                const prayerTimeMinutes = h * 60 + m;

                if (prayerTimeMinutes > currentTimeMinutes) {
                    upcoming = prayer;
                    // Current is the one before this
                    current = i > 0 ? prayerList[i - 1] : prayerList[prayerList.length - 1]; // logic for 'current' if strictly based on intervals
                    // If it's the first prayer of the day (Fajr), current might be Isha from yesterday conceptually? 
                    // Or "Suhoor/Imsak" time. 
                    // Let's stick to simple logic: Current prayer matches the active time slot.
                    break;
                }
            }

            if (!upcoming) {
                // Next is Fajr tomorrow
                upcoming = prayerList[0];
                current = prayerList[prayerList.length - 1]; // Isha
            }

            // Refined "Current" logic:
            // If we are between Fajr and Dhuhr -> Current is Fajr.
            // If before Fajr -> Current is Isha (late night) or None.

            // Let's set next prayer
            setNextPrayer(upcoming);

            // Calculate Current Prayer details
            // We need "End Time" of current prayer, which is Start Time of Next Prayer (roughly)
            if (current && upcoming) {
                setCurrentPrayer({
                    name: current.name,
                    time: current.time, // Start time of current
                    endTime: upcoming.time // Ends when next starts
                });
            } else if (!current && upcoming === prayerList[0]) {
                // After Isha, before Midnight/Fajr
                setCurrentPrayer({
                    name: "Isha",
                    time: timings.Isha,
                    endTime: timings.Fajr
                });
            }

            // Calculate time remaining (optional, used in HeroCards?)
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

    return (
        <div className="max-w-md mx-auto px-4 pb-24">
            {/* Header / Date */}
            <header className="mb-6 text-center pt-2">
                {/*  
                    The visual reference has back/forward arrows for date navigation. 
                    For now just static date.
                 */}
                <h2 className="text-lg font-bold text-foreground">
                    {prayerData.date.hijri.day} {prayerData.date.hijri.month.en}, {prayerData.date.hijri.year}
                </h2>
                <p className="text-xs text-muted-foreground">
                    {prayerData.date.readable}
                </p>
            </header>

            <HeroCards
                prayerData={prayerData}
                nextPrayer={nextPrayer}
                timeRemaining={timeRemaining}
                // Need to pass refined current props
                currentPrayer={currentPrayer}
                currentTime={currentTimeString}
            />

            <InfoRow
                suhoorTime={prayerData.timings.Imsak}
                iftarTime={prayerData.timings.Maghrib}
            />

            <PrayerList
                timings={prayerData.timings}
                nextPrayerName={nextPrayer?.name}
                city={city}
                country={country}
            />

            <SunInfoRow
                sunrise={prayerData.timings.Sunrise}
                midday={prayerData.timings.Dhuhr}
                sunset={prayerData.timings.Sunset}
            />
        </div>
    );
}
