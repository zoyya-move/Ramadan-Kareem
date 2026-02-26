"use client";

import { useState } from "react";
import { ArrowLeft, Search, Heart, Copy, Share2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const DUAS = [
    {
        id: 1,
        title: "Iftar Dua",
        arabic: "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ",
        transliteration: "Dhahaba adh-dhama'u wabtallatil-'uruqu wa thabatal-ajru insha'Allah.",
        translation: "The thirst is gone, the veins are moistened, and the reward is confirmed, if Allah wills.",
        category: "Ramadan",
        tags: ["Fasting", "Evening"]
    },
    {
        id: 2,
        title: "Dua for Forgiveness",
        arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
        transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni.",
        translation: "O Allah, You are Forgiving and love forgiveness, so forgive me.",
        category: "Laylatul Qadr",
        tags: ["Forgiveness", "Ramadan"]
    },
    {
        id: 3,
        title: "Dua Before Eating",
        arabic: "بِسْمِ اللَّهِ",
        transliteration: "Bismillah.",
        translation: "In the name of Allah.",
        category: "Daily",
        tags: ["Eating", "Sunnah"]
    },
    {
        id: 4,
        title: "Dua After Eating",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
        transliteration: "Alhamdulillahilladzi at'amana wa saqana wa ja'alana muslimin.",
        translation: "All praise is due to Allah who fed us, gave us drink, and made us Muslims.",
        category: "Daily",
        tags: ["Eating", "Gratitude"]
    },
    {
        id: 5,
        title: "Dua for Parents",
        arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
        transliteration: "Rabbi irhamhuma kama rabbayani saghira.",
        translation: "My Lord, have mercy upon them [my parents] as they brought me up [when I was] small.",
        category: "Family",
        tags: ["Parents", "Quran"]
    },
    {
        id: 6,
        title: "Dua for Knowledge",
        arabic: "رَبِّ زِدْنِي عِلْمًا",
        transliteration: "Rabbi zidni 'ilma.",
        translation: "My Lord, increase me in knowledge.",
        category: "Education",
        tags: ["Knowledge", "Succcess"]
    }
];

const CATEGORIES = ["All", "Ramadan", "Daily", "Family", "Laylatul Qadr", "Education"];

export default function DuaPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredDuas = DUAS.filter(dua => {
        const matchesSearch = dua.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dua.translation.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "All" || dua.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <main className="min-h-screen bg-slate-50 text-slate-800 pb-24">
            {/* Header */}
            <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-slate-100">
                <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100 -ml-2">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-lg font-bold">Dua Collection</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 py-6 space-y-6">

                {/* Search & Filter */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search dua..."
                            className="pl-10 rounded-xl bg-white border-slate-200 focus:border-violet-500 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === category
                                        ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                                        : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dua List */}
                <div className="space-y-4">
                    {filteredDuas.length > 0 ? (
                        filteredDuas.map(dua => (
                            <Card key={dua.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group bg-white overflow-hidden">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
                                                <span className="font-amiri text-lg">🤲</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{dua.title}</h3>
                                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{dua.category}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                                            <Heart className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-4 text-center py-2">
                                        <p className="font-amiri text-2xl text-slate-800 leading-loose" dir="rtl">
                                            {dua.arabic}
                                        </p>

                                        <div className="space-y-1">
                                            <p className="text-xs text-violet-600 font-medium italic">
                                                {dua.transliteration}
                                            </p>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                "{dua.translation}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-slate-50">
                                        <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-violet-600 gap-1.5">
                                            <Copy className="w-3.5 h-3.5" /> Copy
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-violet-600 gap-1.5">
                                            <Share2 className="w-3.5 h-3.5" /> Share
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-slate-400 text-sm">No dua found.</p>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}
