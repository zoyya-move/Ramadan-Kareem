"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ProgressInsights() {
    const [mounted, setMounted] = useState(false);
    const [worshipProgress, setWorshipProgress] = useState(0);
    const [quranBookmark, setQuranBookmark] = useState<{ surahName: string; ayahNumber: number } | null>(null);
    const [isFasting, setIsFasting] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load Worship Progress
        const savedTasks = localStorage.getItem("worshipTasks");
        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);
            const completed = tasks.filter((t: any) => t.completed).length;
            const total = tasks.length;
            setWorshipProgress(Math.round((completed / total) * 100));
        }

        // Load Quran Bookmark
        const savedBookmark = localStorage.getItem("quranBookmark");
        if (savedBookmark) {
            setQuranBookmark(JSON.parse(savedBookmark));
        }

        // Load Fasting Status (simple daily toggle for now)
        const today = new Date().toDateString();
        const savedFasting = localStorage.getItem("fastingStatus");
        if (savedFasting) {
            const { date, status } = JSON.parse(savedFasting);
            if (date === today) {
                setIsFasting(status);
            }
        }
    }, []);

    const toggleFasting = () => {
        const newState = !isFasting;
        setIsFasting(newState);
        const today = new Date().toDateString();
        localStorage.setItem("fastingStatus", JSON.stringify({ date: today, status: newState }));
    };

    if (!mounted) return <div className="h-32 mb-6" />; // Placeholder to avoid layout shift

    return (
        <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Daily Worship Circle */}
            <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <div className="relative w-16 h-16 mb-2">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                                className="text-muted/30"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className="text-primary transition-all duration-1000 ease-out"
                                strokeDasharray={`${worshipProgress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                            {worshipProgress}%
                        </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Daily Worship</span>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
                {/* Fasting Toggle */}
                <Card
                    className={`cursor-pointer transition-colors border shadow-sm ${isFasting ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}
                    onClick={toggleFasting}
                >
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isFasting ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                            <Moon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Fasting Today?</p>
                            <p className={`text-sm font-bold ${isFasting ? "text-primary" : "text-muted-foreground"}`}>
                                {isFasting ? "Yes, I am!" : "Not really"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Quran Link */}
                <Link href="/quran" className="block">
                    <Card className="bg-card border-border hover:bg-muted/50 transition-colors shadow-sm">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Last Read</p>
                                <p className="text-sm font-bold text-foreground truncate max-w-[100px]">
                                    {quranBookmark ? `${quranBookmark.surahName}` : "Start Reading"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
