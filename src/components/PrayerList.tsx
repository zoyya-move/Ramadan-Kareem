import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellOff, Moon, MapPin, Sun, Sunrise, Sunset } from "lucide-react";
import { PrayerData } from "@/types";

interface PrayerListProps {
    timings: PrayerData['timings'];
    nextPrayerName: string | undefined;
    city: string;
    country: string;
}

export default function PrayerList({ timings, nextPrayerName, city, country }: PrayerListProps) {
    const prayers = [
        { name: "Fajr", time: timings.Fajr, icon: Moon },
        { name: "Dhuhr", time: timings.Dhuhr, icon: Sun },
        { name: "Asr", time: timings.Asr, icon: Sun },
        { name: "Maghrib", time: timings.Maghrib, icon: Sunset },
        { name: "Isha", time: timings.Isha, icon: Moon },
    ];

    return (
        <Card className="bg-white border-none shadow-sm mb-6">
            <CardContent className="p-0">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {city}
                    </h3>
                    <p className="text-xs text-muted-foreground ml-6">{country}</p>
                </div>
                <div className="divide-y divide-slate-50">
                    {prayers.map((prayer) => {
                        const isNext = nextPrayerName === prayer.name;
                        return (
                            <div key={prayer.name} className={`flex justify-between items-center p-4 ${isNext ? 'bg-orange-50/30' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <prayer.icon className={`w-5 h-5 ${isNext ? 'text-primary' : 'text-slate-400'}`} />
                                    <span className={`font-medium ${isNext ? 'text-primary' : 'text-slate-700'}`}>{prayer.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`font-bold font-mono ${isNext ? 'text-primary' : 'text-slate-800'}`}>{prayer.time}</span>
                                    <Bell className={`w-4 h-4 ${isNext ? 'text-primary' : 'text-slate-300'}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

function Map() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
    )
}
