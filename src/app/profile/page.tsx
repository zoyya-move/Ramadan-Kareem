"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, User, TrendingUp, Calendar, LogOut, Settings, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getUserData, getMonthlyLogs } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";

// Duplicate task list for report (or extract to constants file later)
const REPORT_TASKS = [
    { id: "fajr", label: "Subuh", category: "wajib" },
    { id: "dhuhr", label: "Dzuhur", category: "wajib" },
    { id: "asr", label: "Ashar", category: "wajib" },
    { id: "maghrib", label: "Maghrib", category: "wajib" },
    { id: "isha", label: "Isya", category: "wajib" },
    { id: "qobliyah_subuh", label: "Qobliyah Subuh", category: "sunnah" },
    { id: "dhuha", label: "Sholat Dhuha", category: "sunnah" },
    { id: "tarawih", label: "Tarawih", category: "sunnah" },
    { id: "quran", label: "Tadarus", category: "sunnah" },
    { id: "tahajud", label: "Tahajud", category: "sunnah" },
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, signInWithGoogle } = useAuth();
    const [stats, setStats] = useState({
        todayProgress: 0,
        fastingStreak: 0,
        totalFastingDays: 0
    });
    const [worshipHistory, setWorshipHistory] = useState<Record<string, number>>({});
    const [monthlyStats, setMonthlyStats] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Helper to format YYYY-MM-DD
    const formatDateKey = (date: Date) => {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    };

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                try {
                    const userData = await getUserData(user.uid);

                    // 1. Calculate Today's Worship Progress
                    const todayKey = formatDateKey(new Date());
                    let todayProgress = 0;

                    if (userData?.worshipHistory && userData.worshipHistory[todayKey] !== undefined) {
                        todayProgress = userData.worshipHistory[todayKey];
                        setWorshipHistory(userData.worshipHistory);
                    } else {
                        // Fallback to local storage if not synced yet or just for today
                        const savedTasks = localStorage.getItem(`worshipTasks_${todayKey}`);
                        if (savedTasks) {
                            const tasks = JSON.parse(savedTasks);
                            if (Array.isArray(tasks) && tasks.length > 0) {
                                const completed = tasks.filter((t: any) => t.completed).length;
                                todayProgress = Math.round((completed / tasks.length) * 100);
                            }
                        }
                    }

                    // 2. Calculate Fasting Streak & Total
                    let streak = 0;
                    let totalFasting = 0;
                    if (userData?.fastingHistory) {
                        const history = userData.fastingHistory;
                        totalFasting = history.length;

                        // Streak Logic (Same as Dashboard)
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
                                    if (history.includes(dateStr)) streak++; else break;
                                }
                            } else if (history.includes(yesterdayStr)) {
                                streak = 0; // Starts from 0 if today not checked? Or continues from yesterday? 
                                // Dashboard logic: if yesterday checked, streak continues.
                                // Let's use the same logic as dashboard:
                                streak = 0;
                                let current = new Date(today);
                                current.setDate(current.getDate() - 1);
                                while (true) {
                                    const dateStr = formatDateKey(current);
                                    if (history.includes(dateStr)) {
                                        streak++;
                                        current.setDate(current.getDate() - 1);
                                    } else {
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // 3. Calculate Monthly Stats
                    const now = new Date();
                    const logs = await getMonthlyLogs(user.uid, now.getMonth(), now.getFullYear());
                    const mStats: Record<string, number> = {};
                    logs.forEach(log => {
                        if (log.tasks) {
                            log.tasks.forEach((t: any) => {
                                if (t.completed) {
                                    mStats[t.id] = (mStats[t.id] || 0) + 1;
                                }
                            });
                        }
                    });
                    setMonthlyStats(mStats);

                    setStats({
                        todayProgress,
                        fastingStreak: streak,
                        totalFastingDays: totalFasting
                    });

                } catch (error) {
                    console.error("Error loading profile data:", error);
                }
            }
            setLoading(false);
        };

        loadData();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Login failed:", error);
            setIsLoggingIn(false);
        }
    };

    if (!user && !loading) {
        // Redirect or show login prompt if needed, but for now just show skeleton or simple text
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <div className="text-center">
                    <p className="text-slate-500 mb-4">Please log in to view your profile.</p>
                    <Button onClick={handleLogin} disabled={isLoggingIn}>
                        {isLoggingIn ? "Redirecting..." : "Log In with Google"}
                    </Button>
                </div>
            </div>
        );
    }

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    return (
        <main className="min-h-screen bg-slate-50 text-slate-800 pb-24">


            <div className="max-w-md mx-auto px-6 py-8 space-y-8">

                {/* User Profile Card */}
                <div className="flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 mb-4 border-4 border-white shadow-lg">
                        <AvatarImage src={user?.photoURL || ""} />
                        <AvatarFallback className="bg-violet-100 text-violet-600 text-2xl font-bold">
                            {user?.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold text-slate-900">{user?.displayName || "Ramadan User"}</h2>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="border-none shadow-sm bg-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-violet-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                        <CardContent className="p-5 flex flex-col items-center justify-center text-center relative z-10">
                            <div className="h-10 w-10 mb-3 rounded-full flex items-center justify-center bg-violet-50 text-violet-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="text-3xl font-bold text-slate-800">{stats.todayProgress}%</span>
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Today's Worship</span>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                        <CardContent className="p-5 flex flex-col items-center justify-center text-center relative z-10">
                            <div className="h-10 w-10 mb-3 rounded-full flex items-center justify-center bg-amber-50 text-amber-600">
                                <Award className="w-5 h-5" />
                            </div>
                            <span className="text-3xl font-bold text-slate-800">{stats.fastingStreak}</span>
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Day Streak</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Worship Breakdown */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-700">
                            <span>Monthly Breakdown</span>
                            <span className="text-xs font-normal text-slate-400">
                                {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {REPORT_TASKS.map((task) => {
                            const count = monthlyStats[task.id] || 0;
                            const percentage = Math.round((count / daysInMonth) * 100);
                            return (
                                <div key={task.id} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium text-slate-700">{task.label}</span>
                                        <span className="text-slate-500">{count}/{daysInMonth}</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" indicatorClassName={task.category === 'wajib' ? 'bg-violet-500' : 'bg-amber-500'} />
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Ramadan Consistency Heatmap */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-700">
                            <span>Ramadan Consistency</span>
                            <span className="text-xs font-normal text-slate-400">Worship History</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-1.5 justify-center">
                                {Array.from({ length: 30 }).map((_, i) => {
                                    // Calculate date for this grid item (Fixed start date logic same as Dashboard?)
                                    // Dashboard uses Feb 19, 2026. Let's replicate or just use simple past 30 days?
                                    // Dashboard uses Fixed Grid starting Feb 19. Let's match it for consistency.
                                    // Use Local Time constructor to avoid UTC offset issues
                                    const startDate = new Date(2026, 1, 19); // Month is 0-indexed: 1 = Feb
                                    const currentDate = new Date(startDate);
                                    currentDate.setDate(startDate.getDate() + i);
                                    const dateKey = formatDateKey(currentDate);

                                    const value = worshipHistory[dateKey] || 0;

                                    // Simple string comparison for "Future" check
                                    const todayKey = formatDateKey(new Date());
                                    const isFuture = dateKey > todayKey;

                                    let colorClass = "bg-slate-100";
                                    if (value > 0) colorClass = "bg-violet-200";
                                    if (value >= 40) colorClass = "bg-violet-400";
                                    if (value >= 70) colorClass = "bg-violet-500";
                                    if (value === 100) colorClass = "bg-violet-600";

                                    if (isFuture) colorClass = "bg-slate-50 opacity-50 pointer-events-none"; // Added pointer-events-none for future dates

                                    return (
                                        <div
                                            key={i}
                                            className={`w-8 h-8 rounded-md ${colorClass} transition-all hover:scale-110 cursor-pointer relative group flex items-center justify-center`}
                                            title={`${dateKey}: ${value}%`}
                                        >
                                            <span className="text-[8px] text-slate-400 opacity-0 group-hover:opacity-100 absolute -top-4 bg-slate-800 text-white px-1 rounded pointer-events-none">
                                                {currentDate.getDate()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-3 pt-4">
                    <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 h-12 rounded-xl"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Log Out
                    </Button>
                    <p className="text-center text-xs text-slate-400">
                        Vibe Ramadan v1.0.0
                    </p>
                </div>

            </div>
            <BottomNav />
        </main>
    );
}
