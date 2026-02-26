import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellOff } from "lucide-react";

interface InfoRowProps {
    suhoorTime: string;
    iftarTime: string;
}

export default function InfoRow({ suhoorTime, iftarTime }: InfoRowProps) {
    return (
        <Card className="bg-orange-50/50 border-none shadow-sm mb-6">
            <CardContent className="p-4 flex justify-between items-center">
                {/* Suhoor */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-primary">
                        <Bell className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Suhoor</p>
                        <p className="text-lg font-bold text-slate-800">{suhoorTime}</p>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-8 w-[1px] bg-orange-200/50 mx-2"></div>

                {/* Iftar */}
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground font-medium">Iftar</p>
                        <p className="text-lg font-bold text-slate-800">{iftarTime}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-primary">
                        <BellOff className="w-5 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
