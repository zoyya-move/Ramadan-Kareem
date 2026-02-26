"use client";

import { useEffect, useState } from "react";
import { PrayerData } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface CountdownProps {
    nextPrayer: {
        name: string;
        time: string;
    } | null;
}

export default function Countdown({ nextPrayer }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        if (!nextPrayer) return;

        const interval = setInterval(() => {
            const now = new Date();
            const [hours, minutes] = nextPrayer.time.split(":").map(Number);
            const prayerTime = new Date();
            prayerTime.setHours(hours, minutes, 0);

            if (prayerTime < now) {
                prayerTime.setDate(prayerTime.getDate() + 1);
            }

            const diff = prayerTime.getTime() - now.getTime();

            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${h}h ${m}m ${s}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [nextPrayer]);

    if (!nextPrayer) return null;

    return (
        <Card className="mb-6 bg-gradient-to-r from-amber-500 to-orange-600 border-none text-white shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-6">
                <span className="text-sm font-medium opacity-90 uppercase tracking-widest">
                    Time until {nextPrayer.name}
                </span>
                <div className="text-4xl font-bold font-mono mt-1">
                    {timeLeft || "--:--:--"}
                </div>
            </CardContent>
        </Card>
    );
}
