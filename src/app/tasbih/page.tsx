"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

const DHIKR_TYPES = [
    { name: "Create Your Own", arabic: "بِسْمِ اللَّهِ", meaning: "Start with Bismillah" },
    { name: "Subhanallah", arabic: "سُبْحَانَ ٱللَّٰهِ", meaning: "Glory be to Allah" },
    { name: "Alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّٰهِ", meaning: "All praise is due to Allah" },
    { name: "Allahu Akbar", arabic: "ٱللَّٰهُ أَكْبَرُ", meaning: "Allah is the Greatest" },
    { name: "La ilaha illallah", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", meaning: "There is no god but Allah" },
    { name: "Astaghfirullah", arabic: "أَسْتَغْفِرُ ٱللَّٰهَ", meaning: "I seek forgiveness from Allah" },
    { name: "Subhanallahi Wa Bihamdihi", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", meaning: "Glory be to Allah and His is the praise" },
];

export default function TasbihPage() {
    const router = useRouter();
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(33); // 33, 99, or 0 (infinity)
    const [vibrate, setVibrate] = useState(true);
    const [isPressed, setIsPressed] = useState(false);
    const [selectedDhikrIndex, setSelectedDhikrIndex] = useState(1); // Default Subhanallah

    const handleTap = () => {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 100);

        if (vibrate && navigator.vibrate) {
            navigator.vibrate(15);
        }

        setCount(prev => {
            const next = prev + 1;
            if (target > 0 && next > target) {
                if (vibrate && navigator.vibrate) navigator.vibrate([50, 50, 50]); // Long vibrate on lap
                return 1; // Loop back to 1
            }
            if (target > 0 && next === target) {
                if (vibrate && navigator.vibrate) navigator.vibrate(50); // Small notify on complete
            }
            return next;
        });
    };

    const resetCount = () => {
        if (vibrate && navigator.vibrate) navigator.vibrate(30);
        setCount(0);
    };

    const changeTarget = () => {
        const options = [33, 99, 0];
        const currentIndex = options.indexOf(target);
        const nextTarget = options[(currentIndex + 1) % options.length];
        setTarget(nextTarget);
        setCount(0);
    };

    // Calculate rotation for bead simulation
    // We want the active bead to stay at the "top" while the ring rotates counter-clockwise (pulling down).
    // Angle per bead = 360 / 33 (visualizing only 33 beads even for 99 mode for simplicity, or scale it)
    // Let's stick to 33 beads visually.
    const visualBeadCount = 33;
    const anglePerBead = 360 / visualBeadCount;
    // Rotation should be `count * anglePerBead`. 
    // We rotate the ring so the "current" bead moves away from the top center.
    // Actually, usually you pull the bead towards you (down). So top bead moves down.
    // Let's rotate the ring clockwise?
    const rotation = count * anglePerBead;

    return (
        <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-between pb-10 relative overflow-hidden">
            {/* Header */}
            <div className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm border-b border-slate-100">
                <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100 -ml-2">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-lg font-bold">Digital Tasbih</h1>
                    <Button variant="ghost" size="icon" onClick={() => setVibrate(!vibrate)} className="rounded-full hover:bg-slate-100 -mr-2 text-slate-400 hover:text-violet-600">
                        {vibrate ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </Button>
                </div>
            </div>

            {/* Main Interactive Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative pt-6">

                {/* Dhikr Selector */}
                <div className="flex items-center gap-4 mb-2 z-20">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-violet-600" onClick={() => setSelectedDhikrIndex(prev => (prev - 1 + DHIKR_TYPES.length) % DHIKR_TYPES.length)}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-sm font-bold text-slate-700 min-w-[150px] text-center truncate">{DHIKR_TYPES[selectedDhikrIndex].name}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-violet-600" onClick={() => setSelectedDhikrIndex(prev => (prev + 1) % DHIKR_TYPES.length)}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Bead Ring Visualizer */}
                <div className="relative w-80 h-80 mb-4 flex items-center justify-center">
                    {/* The Ring Container that rotates */}
                    <div
                        className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        {Array.from({ length: visualBeadCount }).map((_, i) => {
                            const angle = i * anglePerBead; // 0, 10.9, 21.8...
                            // Check if this is the "active" bead (at index 0 visually, which is top)
                            // Since we rotate the container by rotation, the bead at index 0 moves.
                            // The bead at the top is the one that corresponds to `count % 33`.
                            // Actually it's simpler: The ring has beads 0..32.
                            // We rotate the ring so bead `count` is at the top? No.
                            // Visualizing:
                            // i=0 is at -90deg (top).
                            // We place beads around a circle.
                            // Radius = 140px.
                            const radius = 140;
                            const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
                            const y = radius * Math.sin((angle - 90) * (Math.PI / 180));

                            // Highlight everyday 11th bead (typical tasbih markers)
                            const isMarker = i % 11 === 0 && i !== 0;

                            return (
                                <div
                                    key={i}
                                    className={`absolute w-4 h-4 rounded-full shadow-sm transition-colors duration-300 ${isMarker ? "bg-amber-300 w-5 h-5 border-2 border-white" : "bg-slate-200"
                                        }`}
                                    style={{
                                        left: `calc(50% + ${x}px - ${isMarker ? 10 : 8}px)`,
                                        top: `calc(50% + ${y}px - ${isMarker ? 10 : 8}px)`,
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Center Display / Tap Area */}
                    <div
                        className="relative z-10 w-48 h-48 rounded-full bg-white shadow-xl shadow-violet-100 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform duration-100 select-none group border-4 border-slate-50"
                        onClick={handleTap}
                    >
                        <div className={`absolute inset-0 rounded-full bg-violet-50 opacity-0 transition-opacity duration-300 ${isPressed ? "opacity-100 scale-110" : "group-hover:opacity-50"}`}></div>

                        <span className="text-6xl font-black text-slate-800 tabular-nums relative z-10 tracking-tight">
                            {count}
                        </span>
                        <span className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest relative z-10">
                            {target === 0 ? "Infinite" : `/ ${target}`}
                        </span>
                    </div>

                    {/* Indicator Triangle at Top */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-violet-500 drop-shadow-sm z-20"></div>
                </div>

                {/* Arabic Display */}
                <div className="text-center mb-6 h-20 flex flex-col justify-center px-4">
                    <p className="font-amiri text-2xl md:text-3xl text-slate-800 mb-1 leading-relaxed transition-all duration-300" dir="rtl">
                        {DHIKR_TYPES[selectedDhikrIndex].arabic}
                    </p>
                    <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto line-clamp-2">
                        "{DHIKR_TYPES[selectedDhikrIndex].meaning}"
                    </p>
                </div>

                {/* Controls */}
                <div className="flex gap-6 items-center">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full border-slate-200 text-slate-500 hover:text-violet-600 hover:bg-violet-50"
                        onClick={resetCount}
                    >
                        <RotateCcw className="w-5 h-5" />
                    </Button>

                    <Button
                        className="h-12 px-6 rounded-full bg-slate-900 text-white hover:bg-slate-800 font-bold"
                        onClick={handleTap}
                    >
                        Tap to Count
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full border-slate-200 text-slate-500 hover:text-violet-600 hover:bg-violet-50 relative"
                        onClick={changeTarget}
                    >
                        <span className="text-[10px] font-bold absolute -top-1 -right-1 bg-violet-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                            {target === 0 ? "∞" : target}
                        </span>
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>

                <p className="mt-8 text-xs text-slate-400 max-w-[200px] text-center">
                    Tip: Tap anywhere on the circle or press the button to count.
                </p>

            </div>
        </main>
    );
}
