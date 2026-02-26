"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Share2, Sparkles, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const RepeatingBg = ({ text, color = "text-white/10" }: { text: string, color?: string }) => (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none flex flex-wrap gap-x-4 gap-y-0 ${color} font-black text-[5rem] md:text-[8rem] uppercase leading-[0.8] opacity-30 select-none items-start justify-start -z-10 break-all`}>
        {Array.from({ length: 40 }).map((_, i) => (
            <span key={i} className="whitespace-nowrap">{text}</span>
        ))}
    </div>
);

const SLIDES = [
    {
        id: "intro",
        bgColor: "bg-[#4c1d95]", // Deep violet
        content: (props: any) => (
            <div className="relative flex flex-col items-center justify-center h-full text-center px-6 animate-in fade-in zoom-in duration-700 overflow-hidden p-8">
                <RepeatingBg text={`Ramadan `} color="text-[#ccff00]" />

                <h2 className="text-[#ccff00] font-serif font-bold text-3xl tracking-wide mb-12 z-10 drop-shadow-md">Ramadan Reflections</h2>

                <div className="relative flex items-center justify-center w-72 h-72 mt-10 z-10">
                    <div className="absolute inset-0 bg-[#ffde00] rotate-12 rounded-[40px] scale-110 shadow-2xl opacity-90"></div>
                    <div className="absolute inset-0 bg-[#ffde00] rotate-45 rounded-[40px] scale-110 shadow-2xl opacity-90"></div>
                    <div className="absolute inset-0 bg-[#ffde00] -rotate-12 rounded-[40px] scale-110 shadow-2xl opacity-90"></div>
                    <div className="absolute inset-0 bg-[#ffde00] rounded-[50px] scale-125 shadow-2xl opacity-90"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                        <p className="text-[#4c1d95] font-serif font-bold text-3xl mb-2">Hi {props.userName},</p>
                        <p className="text-[#4c1d95] font-semibold text-xl leading-relaxed mt-2">this beautiful month,<br />your heart blossomed.</p>
                    </div>
                </div>

                <p className="text-[#ccff00] font-semibold text-lg mt-32 bg-[#ccff00]/10 border border-[#ccff00]/50 px-8 py-3 rounded-full animate-pulse z-10 backdrop-blur-sm">Tap to reflect</p>
            </div>
        )
    },
    {
        id: "fasting",
        bgColor: "bg-[#4c1d95]",
        content: (props: any) => (
            <div className="relative flex flex-col items-center justify-center h-full text-center px-6 animate-in slide-in-from-right duration-500 overflow-hidden bg-[#1a096e]">
                <RepeatingBg text={`Patience `} color="text-white/20" />

                <h2 className="text-[#fff] text-3xl font-serif font-bold drop-shadow-sm z-10">Days of Grace</h2>

                <div className="text-[10rem] md:text-[12rem] font-serif font-bold text-[#ff6b00] my-4 leading-none drop-shadow-xl z-10">
                    {props.stats.fastingDays}
                </div>
                <p className="text-2xl text-[#f2b424] font-serif font-bold z-10 leading-none">days of fasting</p>

                <div className="mt-16 bg-[#4c1d95] text-white px-8 py-5 rounded-2xl transform rotate-2 border-2 border-[#ff6b00]/50 shadow-xl z-10 max-w-[85%]">
                    <p className="font-semibold text-lg md:text-xl font-serif italic">A beautiful journey of patience for the Almighty.</p>
                </div>
            </div>
        )
    },
    {
        id: "worship",
        bgColor: "bg-[#ff6b00]",
        content: (props: any) => (
            <div className="relative flex flex-col items-center justify-center h-full text-center px-6 animate-in slide-in-from-right duration-500 overflow-hidden">
                <RepeatingBg text="Devotion " color="text-yellow-400/20" />

                <h2 className="text-white text-3xl md:text-4xl mb-12 font-serif font-bold drop-shadow-md z-10 leading-tight">Rhythm of<br />Devotion</h2>

                <div className="relative z-10 transform -rotate-3">
                    <div className="absolute inset-0 bg-[#4c1d95] transform rotate-3 rounded-3xl translate-x-2 translate-y-2 opacity-80"></div>
                    <div className="relative bg-[#ffde00] border-4 border-[#4c1d95] rounded-3xl p-8 flex flex-col items-center shadow-xl">
                        <span className="text-[6rem] font-serif font-bold text-[#4c1d95] leading-none">{props.stats.avgWorship}%</span>
                        <span className="text-xl text-[#4c1d95] font-semibold mt-4">Daily Ibadah Rate</span>
                    </div>
                </div>

                <div className="mt-20 bg-white text-[#ff6b00] px-6 py-4 rounded-xl transform rotate-1 shadow-lg z-10 max-w-[85%] border-2 border-[#ffde00]">
                    <p className="font-serif text-lg leading-relaxed italic">"The most beloved deeds are those done consistently."</p>
                </div>
            </div>
        )
    },
    {
        id: "streak",
        bgColor: "bg-[#0000ff]",
        content: (props: any) => (
            <div className="relative flex flex-col items-center justify-center h-full text-center px-6 animate-in slide-in-from-right duration-500 overflow-hidden">
                <RepeatingBg text="Faith " color="text-white/10" />

                <h2 className="text-[#ccff00] text-3xl md:text-4xl font-serif font-bold mb-12 drop-shadow-lg z-10 leading-tight">Unbroken<br />Light</h2>

                <div className="relative flex items-center justify-center w-64 h-64 mt-4 z-10">
                    <div className="absolute inset-0 bg-[#ff6b00]/90 rotate-12 rounded-[40px] scale-110 shadow-xl"></div>
                    <div className="absolute inset-0 bg-[#ffde00]/90 rotate-45 rounded-[40px] scale-90 shadow-lg"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                        <div className="text-[5rem] font-serif font-bold text-[#0000ff] leading-none drop-shadow-sm">
                            {props.stats.longestStreak}
                        </div>
                        <p className="text-lg text-[#ff6b00] font-bold mt-2">days streak</p>
                    </div>
                </div>

                <div className="mt-24 bg-white text-[#0000ff] px-8 py-5 rounded-2xl border-2 border-[#ff6b00] shadow-xl z-10 max-w-[85%]">
                    <p className="font-serif text-lg md:text-xl font-medium italic">You kept the light of faith burning bright.</p>
                </div>
            </div>
        )
    },
    {
        id: "favorite",
        bgColor: "bg-[#ffde00]",
        content: (props: any) => (
            <div className="relative flex flex-col items-center h-full px-6 py-12 animate-in slide-in-from-right duration-500 overflow-hidden">
                <RepeatingBg text={`Love `} color="text-orange-500/10" />

                <div className="flex flex-col items-center gap-3 mb-10 mt-8 z-10 text-center">
                    <div className="w-12 h-12 bg-[#4c1d95] rounded-full flex items-center justify-center shadow-md">
                        <Sparkles className="w-6 h-6 text-[#ccff00]" />
                    </div>
                    <h2 className="text-3xl text-[#4c1d95] font-serif font-bold leading-none drop-shadow-sm">Cherished<br />Habits</h2>
                </div>

                <div className="space-y-4 w-full max-w-sm mx-auto z-10 mt-2">
                    {props.stats.topTasks.map((task: any, idx: number) => (
                        <div
                            key={idx}
                            className="flex items-center gap-4 bg-white/90 p-4 rounded-xl shadow-md border-l-4 border-[#4c1d95] opacity-0 animate-[fade_0.5s_ease-out_forwards]"
                            style={{ animationDelay: `${idx * 150 + 300}ms` }}
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ff6b00]/20 text-[#ff6b00] font-bold text-lg shrink-0">
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0 text-left line-clamp-2">
                                <p className="text-[#4c1d95] font-semibold text-lg leading-tight">{task.name}</p>
                                <p className="text-[#ff6b00] text-sm mt-1">{task.count} times completed</p>
                            </div>
                        </div>
                    ))}

                    {props.stats.topTasks.length === 0 && (
                        <p className="text-[#4c1d95] bg-white p-4 rounded-xl font-medium text-center shadow-sm">Taking the gentle first steps...</p>
                    )}
                </div>

                <div className="mt-12 bg-[#4c1d95] text-[#ffde00] px-6 py-4 rounded-xl shadow-lg z-10 max-w-[90%] mx-auto text-center border border-[#4c1d95]/50">
                    <p className="font-serif text-sm md:text-base leading-relaxed italic">"Every small step towards Him is a leap towards peace."</p>
                </div>
            </div>
        )
    },
    {
        id: "outro",
        bgColor: "bg-[#4c1d95]",
        content: (props: any) => (
            <div className="relative flex flex-col items-center justify-center h-full text-center px-6 animate-in zoom-in duration-700 overflow-hidden">
                <RepeatingBg text="Blessings " color="text-[#ccff00]/5" />

                <div className="text-[3.5rem] md:text-[5rem] text-center font-serif font-bold text-[#ccff00] leading-tight mb-12 drop-shadow-xl z-10">
                    Masha'Allah
                </div>

                <div className="bg-[#ffde00] p-8 rounded-3xl transform -rotate-1 mb-16 shadow-2xl z-10 w-full max-w-[85%] border-2 border-[#ff6b00]/50">
                    <p className="text-[#4c1d95] text-xl md:text-2xl font-serif italic leading-relaxed font-semibold">
                        May every deed<br />blossom into<br />endless blessings.
                    </p>
                </div>

                <button
                    onClick={() => navigator.clipboard.writeText(`My Ramadan Journey: ${props.stats.fastingDays} days fasted, ${props.stats.avgWorship}% avg worship, ${props.stats.longestStreak} days streak! #RamadanVibe`)}
                    className="flex items-center justify-center gap-3 bg-[#ff6b00] text-white px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 active:scale-95 transition-all shadow-lg z-10 border border-[#ff6b00]/80"
                >
                    <Share2 className="w-5 h-5" />
                    Share your journey
                </button>
            </div>
        )
    }
];

export default function RecapPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [stats, setStats] = useState({
        fastingDays: 0,
        avgWorship: 0,
        longestStreak: 0,
        topTasks: [] as { name: string; count: number; }[]
    });

    const userName = user?.displayName ? user.displayName.split(' ')[0] : "There";
    const year = new Date().getFullYear();

    useEffect(() => {
        const fastingStr = localStorage.getItem("fastingHistory");
        const worshipStr = localStorage.getItem("worshipHistory");

        let fastingDaysArr = [];
        if (fastingStr) {
            try { fastingDaysArr = JSON.parse(fastingStr); } catch (e) { }
        }

        let worshipObj: Record<string, number> = {};
        if (worshipStr) {
            try { worshipObj = JSON.parse(worshipStr); } catch (e) { }
        }

        const fastingDays = fastingDaysArr.length;

        const worshipValues = Object.values(worshipObj);
        const avgWorship = worshipValues.length > 0
            ? Math.round(worshipValues.reduce((a, b) => a + b, 0) / worshipValues.length)
            : 0;

        let longestStreak = 0;
        if (fastingDaysArr.length > 0) {
            const sortedDates = [...fastingDaysArr].sort();
            let currentStrk = 1;
            let maxStrk = 1;

            for (let i = 1; i < sortedDates.length; i++) {
                const prev = new Date(sortedDates[i - 1]);
                const curr = new Date(sortedDates[i]);
                const diffTime = Math.abs(curr.getTime() - prev.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    currentStrk++;
                    if (currentStrk > maxStrk) maxStrk = currentStrk;
                } else if (diffDays > 1) {
                    currentStrk = 1;
                }
            }
            longestStreak = maxStrk;
        }

        let taskCounts: Record<string, number> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith("worshipTasks_")) {
                try {
                    const t = JSON.parse(localStorage.getItem(k) || "[]");
                    t.forEach((task: any) => {
                        if (task.completed) {
                            let label = task.label;
                            if (["Sholat Subuh", "Sholat Dzuhur", "Sholat Ashar", "Sholat Maghrib", "Sholat Isya"].includes(label)) {
                                label = "Sholat 5 Waktu";
                            }
                            taskCounts[label] = (taskCounts[label] || 0) + 1;
                        }
                    });
                } catch (e) { }
            }
        }

        const topTasks = Object.entries(taskCounts)
            .sort((a, b) => b[1] - a[1]) // sort by count descending
            .slice(0, 5) // top 5
            .map(([name, count]) => ({ name, count }));

        setStats({ fastingDays, avgWorship, longestStreak, topTasks });
    }, []);

    const nextSlide = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(p => p + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(p => p - 1);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 ${SLIDES[currentSlide].bgColor} transition-colors duration-200 overflow-hidden font-sans`}>

            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-2 z-50">
                {SLIDES.map((_, idx) => (
                    <div key={idx} className="h-1.5 flex-1 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                        <div
                            className={`h-full bg-white transition-all duration-300 ${idx < currentSlide ? "w-full" : idx === currentSlide ? "w-full animate-[progress_5s_linear_forwards]" : "w-0"
                                }`}
                            style={idx === currentSlide ? { animationPlayState: 'running' } : {}}
                            onAnimationEnd={() => {
                                if (idx === currentSlide) nextSlide();
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Close Button */}
            <button
                onClick={() => router.back()}
                className="absolute top-10 right-4 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/30 z-50 transition-colors shadow-lg"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Click zones */}
            <div className="absolute inset-0 z-40 flex">
                <div className="w-1/3 h-full" onClick={prevSlide} />
                <div className="w-2/3 h-full" onClick={nextSlide} />
            </div>

            {/* Slide Content */}
            <div className="relative z-10 w-full h-full pointer-events-none">
                {SLIDES[currentSlide].content({ stats, userName, year })}
            </div>

            <style jsx global>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes fade {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
