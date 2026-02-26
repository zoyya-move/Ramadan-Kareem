import { Card, CardContent } from "@/components/ui/card";
import { PrayerData } from "@/types";

interface HeroCardsProps {
    prayerData: PrayerData | null;
    nextPrayer: { name: string; time: string } | null;
    timeRemaining: string;
    currentPrayer: { name: string; time: string; endTime: string } | null;
    currentTime: string;
}

export default function HeroCards({ prayerData, nextPrayer, timeRemaining, currentPrayer, currentTime }: HeroCardsProps) {
    if (!prayerData) return null;

    // We need "Now time is" -> current active prayer
    // This logic needs to be passed in or calculated. 
    // For now, let's assume the parent calculates "Current Prayer" or we derive it.
    // Actually, distinct "current" vs "next" might be tricky if "next" is Fajr tomorrow.

    // Let's infer "Current Time" block as just the current time or the current prayer interval.
    // The reference showed "Now time is Duhur".

    // Simpler: Just display Next Prayer on right, and Current Prayer on left.
    // We need "currentPrayer" prop.

    return (
        <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Current Status Card */}
            <Card className="bg-gradient-to-br from-orange-100 to-orange-50 border-none shadow-sm h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Now time is</p>
                        <h3 className="text-xl font-bold text-primary">
                            {/* Placeholder for now, parent should pass this */}
                            {currentPrayer?.name || "..."}
                        </h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800">
                            {/* Real-time clock should go here? Or just the prayer start time? */}
                            {/* The image shows a clock '12:27 Pm' */}
                            {currentTime || "--:--"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">End time - {currentPrayer?.endTime}</p>
                    </div>
                    {/* Mosque Icon Silhouette could be a background image or SVG */}
                </CardContent>
            </Card>

            {/* Next Prayer Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-white border-none shadow-sm h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Next prayer is</p>
                        <h3 className="text-xl font-bold text-primary">
                            {nextPrayer?.name || "--"}
                        </h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800">
                            {nextPrayer?.time || "--:--"}
                        </p>
                        <div className="mt-1 flex flex-col gap-0.5">
                            <p className="text-[10px] text-muted-foreground">Azan - {nextPrayer?.time}</p>
                            <p className="text-[10px] text-muted-foreground">Jama'at - --:--</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
