"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { syncUserData, saveDailyLog, getDailyLog } from "@/lib/db";

interface WorshipTask {
    id: string;
    label: string;
    category: "wajib" | "sunnah";
    completed: boolean;
}

const DEFAULT_TASKS: WorshipTask[] = [
    // Wajib
    { id: "fajr", label: "Sholat Subuh", category: "wajib", completed: false },
    { id: "dhuhr", label: "Sholat Dzuhur", category: "wajib", completed: false },
    { id: "asr", label: "Sholat Ashar", category: "wajib", completed: false },
    { id: "maghrib", label: "Sholat Maghrib", category: "wajib", completed: false },
    { id: "isha", label: "Sholat Isya", category: "wajib", completed: false },

    // Sunnah
    { id: "tahajud", label: "Sholat Tahajud", category: "sunnah", completed: false },
    { id: "sahur", label: "Makan Sahur", category: "sunnah", completed: false },
    { id: "qobliyah_subuh", label: "Sunnah Qobliyah Subuh", category: "sunnah", completed: false },
    { id: "sedekah_subuh", label: "Sedekah Subuh", category: "sunnah", completed: false },
    { id: "dhikr_pagi", label: "Dzikir Pagi", category: "sunnah", completed: false },
    { id: "dhuha", label: "Sholat Dhuha", category: "sunnah", completed: false },
    { id: "qobliyah_dzuhur", label: "Sunnah Qobliyah Dzuhur", category: "sunnah", completed: false },
    { id: "badiyah_dzuhur", label: "Sunnah Ba'diyah Dzuhur", category: "sunnah", completed: false },
    { id: "qobliyah_ashar", label: "Sunnah Qobliyah Ashar", category: "sunnah", completed: false },
    { id: "dhikr_petang", label: "Dzikir Petang", category: "sunnah", completed: false },
    { id: "qobliyah_maghrib", label: "Sunnah Qobliyah Maghrib", category: "sunnah", completed: false },
    { id: "badiyah_maghrib", label: "Sunnah Ba'diyah Maghrib", category: "sunnah", completed: false },
    { id: "qobliyah_isya", label: "Sunnah Qobliyah Isya", category: "sunnah", completed: false },
    { id: "badiyah_isya", label: "Sunnah Ba'diyah Isya", category: "sunnah", completed: false },
    { id: "tarawih", label: "Sholat Tarawih", category: "sunnah", completed: false },
    { id: "quran", label: "Tadarus Al-Qur'an", category: "sunnah", completed: false },
];

interface WorshipTrackerProps {
    fastingHistory: string[];
    onFastingChange: (status: boolean, date: string) => void;
}

export default function WorshipTracker({ fastingHistory = [], onFastingChange }: WorshipTrackerProps) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<WorshipTask[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Ref to track which date's data is currently fully loaded into 'tasks'
    // This prevents the 'save' effect from overwriting data during date transitions
    const loadedDateRef = useRef<string | null>(null);

    // Helper to format YYYY-MM-DD
    const formatDateKey = (date: Date) => {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    };

    const isFasting = fastingHistory.includes(formatDateKey(selectedDate));

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Load data when Selected Date changes
    useEffect(() => {
        setMounted(true);
        const loadData = async () => {
            setIsLoading(true);
            const dateKey = formatDateKey(selectedDate);
            const storageKey = `worshipTasks_${dateKey}`;

            // 1. Try Local Storage first
            const saved = localStorage.getItem(storageKey);
            let currentTasks = DEFAULT_TASKS;

            if (saved) {
                try {
                    const parsedSaved: WorshipTask[] = JSON.parse(saved);
                    currentTasks = DEFAULT_TASKS.map(defaultTask => {
                        const savedTask = parsedSaved.find(t => t.id === defaultTask.id);
                        return savedTask ? { ...defaultTask, completed: savedTask.completed } : defaultTask;
                    });
                } catch (e) {
                    console.error("Failed to parse saved tasks", e);
                }
            }

            // 2. Try Firestore if logged in
            if (user) {
                try {
                    const docData = await getDailyLog(user.uid, dateKey);
                    if (docData && docData.tasks) {
                        const remoteTasks: WorshipTask[] = docData.tasks;
                        currentTasks = DEFAULT_TASKS.map(defaultTask => {
                            const savedTask = remoteTasks.find(t => t.id === defaultTask.id);
                            return savedTask ? { ...defaultTask, completed: savedTask.completed } : defaultTask;
                        });
                        // Also update local storage to keep them in sync
                        localStorage.setItem(storageKey, JSON.stringify(currentTasks));
                    }
                } catch (err) {
                    console.error("Error fetching daily log:", err);
                }
            }

            setTasks(currentTasks);
            // CRITICAL: Update the ref to allow saving only AFTER loading is done for this date
            loadedDateRef.current = dateKey;
            setIsLoading(false);
        };

        if (mounted) {
            loadData();
        } else {
            // Initial load
            loadData();
        }
    }, [selectedDate, user, mounted]);

    // Save data when Tasks change
    useEffect(() => {
        if (!mounted) return;

        const dateKey = formatDateKey(selectedDate);

        // CRITICAL GUARD:
        // Only save if the tasks currently in state belong to the selectedDate.
        // This mismatch happens during date switching before the load effect finishes.
        if (loadedDateRef.current !== dateKey) {
            return;
        }

        const storageKey = `worshipTasks_${dateKey}`;

        // 1. Save to Local Storage
        localStorage.setItem(storageKey, JSON.stringify(tasks));

        // 2. Update History Summary (for Heatmap)
        const history = JSON.parse(localStorage.getItem("worshipHistory") || "{}");
        const progress = Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
        history[dateKey] = progress;
        localStorage.setItem("worshipHistory", JSON.stringify(history));

        // 3. Sync to Firestore
        if (user) {
            saveDailyLog(user.uid, dateKey, {
                tasks: tasks,
                progress: progress,
                updatedAt: new Date().toISOString()
            });

            // Also sync the main history summary for the heatmap
            syncUserData(user.uid, {
                worshipHistory: history
            });
        }

        // Notify Dashboard to refresh heatmap
        window.dispatchEvent(new Event('worshipProgressUpdated'));
    }, [tasks, selectedDate, user, mounted]);

    const handleDateChange = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const toggleFasting = (checked: boolean) => {
        onFastingChange(checked, formatDateKey(selectedDate));
    };

    const toggleTask = (id: string) => {
        setTasks((prev) =>
            prev.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    };

    if (!mounted) return null;

    const progress = Math.round(
        (tasks.filter((t) => t.completed).length / tasks.length) * 100
    );

    return (
        <Card className="w-full bg-transparent border-none shadow-none mt-0 rounded-none overflow-visible">
            <CardContent className="grid gap-3 p-6 pt-2">

                {/* Date Navigation */}
                <div className="flex items-center justify-between bg-white rounded-2xl p-2 mb-2 shadow-sm border border-slate-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDateChange(-1)}
                        className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-bold text-slate-700">
                            {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </span>
                        {isToday(selectedDate) && (
                            <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-bold">
                                Hari Ini
                            </span>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDateChange(1)}
                        disabled={isToday(selectedDate)} // Disable future dates logic if desired? Or allow planning? Let's disable future for now to keep it sane.
                        className={`h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500 ${isToday(selectedDate) ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Fasting Tracker Section */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 mb-4 border border-amber-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full blur-xl -mr-6 -mt-6"></div>
                    <div className="relative z-10 flex justify-between items-center mb-3">
                        <div>
                            <h3 className="font-bold text-base text-amber-900">Daily Fasting</h3>
                            <p className="text-[11px] text-amber-700/80">Track your Sawm today</p>
                        </div>
                        <Switch
                            checked={isFasting}
                            onCheckedChange={toggleFasting}
                            className="data-[state=checked]:bg-amber-500 scale-90 origin-right"
                        />
                    </div>

                    {isFasting ? (
                        <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl flex items-center gap-3 border border-amber-100/50">
                            <span className="text-xl">🌙</span>
                            <div>
                                <p className="text-xs font-bold text-amber-800">Fasting Active</p>
                                <p className="text-[10px] text-amber-600 leading-tight">May Allah accept your fast.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl flex items-center gap-3 text-slate-500 border border-slate-100/50">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-xs">Not fasting today</p>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-10 text-slate-400">Loading...</div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                {isToday(selectedDate) ? "Progress Hari Ini" : "Progress Harian"}
                            </span>
                            <span className="text-xs font-mono text-violet-600 font-bold">{progress}% Completed</span>
                        </div>
                        <div className="space-y-6">
                            {/* Wajib Section */}
                            <div>
                                <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-violet-800 uppercase tracking-wider">
                                    <div className="w-1.5 h-4 bg-violet-600 rounded-full"></div>
                                    Ibadah Wajib
                                </h4>
                                <div className="space-y-2">
                                    {tasks.filter(t => t.category === 'wajib').map((task) => (
                                        <div
                                            key={task.id}
                                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all border ${task.completed ? "bg-violet-50 border-violet-100" : "bg-white hover:bg-slate-50 border-slate-100 shadow-sm"}`}
                                        >
                                            <Checkbox
                                                id={task.id}
                                                checked={task.completed}
                                                onCheckedChange={() => toggleTask(task.id)}
                                                className="w-5 h-5 border-2 rounded-full border-muted-foreground data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                                            />
                                            <Label
                                                htmlFor={task.id}
                                                className={`flex-1 cursor-pointer font-medium text-sm ${task.completed ? "text-slate-400 line-through decoration-violet-300" : "text-slate-700"
                                                    }`}
                                            >
                                                {task.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sunnah Section */}
                            <div>
                                <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-amber-700 uppercase tracking-wider">
                                    <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                                    Ibadah Sunnah
                                </h4>
                                <div className="space-y-2">
                                    {tasks.filter(t => t.category === 'sunnah').map((task) => (
                                        <div
                                            key={task.id}
                                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all border ${task.completed ? "bg-amber-50 border-amber-100" : "bg-white hover:bg-slate-50 border-slate-100 shadow-sm"}`}
                                        >
                                            <Checkbox
                                                id={task.id}
                                                checked={task.completed}
                                                onCheckedChange={() => toggleTask(task.id)}
                                                className="w-5 h-5 border-2 rounded-full border-muted-foreground data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                            />
                                            <Label
                                                htmlFor={task.id}
                                                className={`flex-1 cursor-pointer font-medium text-sm ${task.completed ? "text-slate-400 line-through decoration-amber-300" : "text-slate-700"
                                                    }`}
                                            >
                                                {task.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
