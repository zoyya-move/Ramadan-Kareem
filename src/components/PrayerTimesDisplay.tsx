"use client";

import { useEffect, useState } from "react";
import { getPrayerTimes } from "@/lib/api";
import { PrayerData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Moon } from "lucide-react";
import Countdown from "./Countdown";

export default function PrayerTimesDisplay() {
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [city, setCity] = useState("Jakarta"); // Default for now
    const [country, setCountry] = useState("Indonesia");
    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const data = await getPrayerTimes(city, country);
            setPrayerData(data);
            setLoading(false);
        }
        fetchData();
    }, [city, country]);

    useEffect(() => {
        if (!prayerData) return;

        const prayers = [
            { name: "Fajr", time: prayerData.timings.Fajr },
            { name: "Dhuhr", time: prayerData.timings.Dhuhr },
            { name: "Asr", time: prayerData.timings.Asr },
            { name: "Maghrib", time: prayerData.timings.Maghrib },
            { name: "Isha", time: prayerData.timings.Isha },
        ];

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        let upcoming = null;

        for (const prayer of prayers) {
            const [h, m] = prayer.time.split(":").map(Number);
            const prayerTime = h * 60 + m;
            if (prayerTime > currentTime) {
                upcoming = prayer;
                break;
            }
        }

        if (!upcoming) {
            // If no upcoming prayer today, it must be Fajr tomorrow
            upcoming = prayers[0];
        }

        setNextPrayer(upcoming);
    }, [prayerData]);

    if (loading) {
        return (
            <Card className="w-full max-w-md mx-auto bg-slate-900/50 border-slate-700">
                <CardHeader>
                    <Skeleton className="h-4 w-[250px] bg-slate-700" />
                    <Skeleton className="h-4 w-[200px] bg-slate-700" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full bg-slate-700" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!prayerData) {
        return (
            <Card className="w-full max-w-md mx-auto bg-red-900/20 border-red-800">
                <CardContent className="pt-6 text-center text-red-400">
                    Failed to load prayer times.
                </CardContent>
            </Card>
        );
    }

    const prayers = [
        { name: "Imsak", time: prayerData.timings.Imsak },
        { name: "Fajr", time: prayerData.timings.Fajr },
        { name: "Dhuhr", time: prayerData.timings.Dhuhr },
        { name: "Asr", time: prayerData.timings.Asr },
        { name: "Maghrib", time: prayerData.timings.Maghrib },
        { name: "Isha", time: prayerData.timings.Isha },
    ];

    return (
        <div className="w-full max-w-md mx-auto mb-6">
            <Countdown nextPrayer={nextPrayer} />

            <div className="mt-4">
                <div className="flex justify-between items-end mb-2 px-1">
                    <h2 className="text-sm font-medium text-muted-foreground">Prayer Times</h2>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{city}</span>
                    </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                    {prayers.map((prayer) => (
                        <Card
                            key={prayer.name}
                            className={`min-w-[100px] snap-center flex-shrink-0 border transition-colors shadow-sm ${nextPrayer?.name === prayer.name ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
                        >
                            <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                                <span className={`text-xs mb-1 ${nextPrayer?.name === prayer.name ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                    {prayer.name}
                                </span>
                                <span className={`text-lg font-mono font-bold ${nextPrayer?.name === prayer.name ? "text-white" : "text-foreground"}`}>
                                    {prayer.time}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
