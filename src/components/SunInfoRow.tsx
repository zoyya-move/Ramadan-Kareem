import { Card, CardContent } from "@/components/ui/card";

interface SunInfoRowProps {
    sunrise: string;
    midday: string; // Dhuhr
    sunset: string;
}

export default function SunInfoRow({ sunrise, midday, sunset }: SunInfoRowProps) {
    return (
        <Card className="bg-orange-50/50 border-none shadow-sm mb-24">
            <CardContent className="p-4 grid grid-cols-3 divide-x divide-orange-200/50 text-center">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Sunrise</p>
                    <p className="text-sm font-bold text-slate-800">{sunrise}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Mid Day</p>
                    <p className="text-sm font-bold text-slate-800">{midday}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Sunset</p>
                    <p className="text-sm font-bold text-slate-800">{sunset}</p>
                </div>
            </CardContent>
        </Card>
    );
}
