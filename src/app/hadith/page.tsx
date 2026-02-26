"use client";

import { useState } from "react";
import { ArrowLeft, Search, Heart, Copy, Share2, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const HADITHS = [
    {
        id: 1,
        source: "Sahih Bukhari",
        narrator: "Abu Huraira",
        text: "The Prophet (ﷺ) said: \"Whoever does not give up forged speech and evil actions, Allah is not in need of his leaving his food and drink (i.e. Allah will not accept his fasting).\"",
        category: "Ramadan",
        arabic: "مَنْ لَمْ يَدَعْ قَوْلَ الزُّورِ وَالْعَمَلَ بِهِ فَلَيْسَ لِلَّهِ حَاجَةٌ فِي أَنْ يَدَعَ طَعَامَهُ وَشَرَابَهُ"
    },
    {
        id: 2,
        source: "Sahih Muslim",
        narrator: "Abu Huraira",
        text: "The Messenger of Allah (ﷺ) said: \"When the month of Ramadan starts, the gates of the heaven are opened and the gates of Hell are closed and the devils are chained.\"",
        category: "Ramadan",
        arabic: "إِذَا جَاءَ رَمَضَانُ فُتِّحَتْ أَبْوَابُ الْجَنَّةِ، وَغُلِّقَتْ أَبْوَابُ النَّارِ، وَصُفِّدَتِ الشَّيَاطِينُ"
    },
    {
        id: 3,
        source: "Sahih Bukhari",
        narrator: "Sahl",
        text: "The Prophet (ﷺ) said: \"There is a gate in Paradise called Ar-Raiyan, and those who observe fasts will enter through it on the Day of Resurrection and none except them will enter through it.\"",
        category: "Ramadan",
        arabic: "إِنَّ فِي الْجَنَّةِ بَابًا يُقَالُ لَهُ الرَّيَّانُ، يَدْخُلُ مِنْهُ الصَّائِمُونَ يَوْمَ الْقِيَامَةِ، لاَ يَدْخُلُ مِنْهُ أَحَدٌ غَيْرُهُمْ"
    },
    {
        id: 4,
        source: "Sahih Muslim",
        narrator: "Abu Huraira",
        text: "The Messenger of Allah (ﷺ) said: \"The five daily prayers, and from one Friday prayer to the next, and from one Ramadan to the next are expiations for sins committed in between provided one stays away from the major sins.\"",
        category: "Virtues",
        arabic: "الصَّلَوَاتُ الْخَمْسُ وَالْجُمُعَةُ إِلَى الْجُمُعَةِ وَرَمَضَانُ إِلَى رَمَضَانَ مُكَفِّرَاتٌ مَا بَيْنَهُنَّ إِذَا اجْتَنَبَ الْكَبَائِرَ"
    },
    {
        id: 5,
        source: "Sahih Bukhari",
        narrator: "‘Aisha (Mother of the Believers)",
        text: "Allah's Messenger (ﷺ) used to practice Itikaf in the last ten nights of Ramadan and used to say, \"Look for the Night of Qadr in the last ten nights of the month of Ramadan.\"",
        category: "Laylatul Qadr",
        arabic: "تَحَرَّوْا لَيْلَةَ الْقَدْرِ فِي الْوِتْرِ مِنَ الْعَشْرِ الأَوَاخِرِ مِنْ رَمَضَانَ"
    },
    {
        id: 6,
        source: "Sahih Bukhari",
        narrator: "Anas bin Malik",
        text: "The Prophet (ﷺ) said: \"Take Suhur as there is a blessing in it.\"",
        category: "Sunnah",
        arabic: "تَسَحَّرُوا فَإِنَّ فِي السُّحُورِ بَرَكَةً"
    }
];

const CATEGORIES = ["All", "Ramadan", "Virtues", "Laylatul Qadr", "Sunnah"];

export default function HadithPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    // Featured Hadith (Random or fixed for now)
    const featuredHadith = HADITHS[1];

    const filteredHadiths = HADITHS.filter(h => {
        const matchesSearch = h.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.narrator.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "All" || h.category === activeCategory;
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
                    <h1 className="text-lg font-bold">Noble Hadith</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 py-6 space-y-6">

                {/* Hero Card: Hadith of the Day */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -ml-12 -mb-12"></div>

                    <div className="relative z-10 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <Badge className="bg-amber-400 hover:bg-amber-500 text-slate-900 border-none font-bold">
                                Hadith of the Day
                            </Badge>
                            <User className="w-5 h-5 text-slate-400" />
                        </div>

                        <p className="font-amiri text-2xl mb-4 leading-loose text-slate-100" dir="rtl">
                            {featuredHadith.arabic}
                        </p>

                        <p className="text-sm font-medium leading-relaxed text-slate-300 mb-4">
                            "{featuredHadith.text}"
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                            <BookOpen className="w-3 h-3" />
                            <span>{featuredHadith.source}</span>
                            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                            <span>{featuredHadith.narrator}</span>
                        </div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search topics or narrators..."
                            className="pl-10 rounded-xl bg-white border-slate-200 focus:border-slate-800 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === category
                                        ? "bg-slate-800 text-white shadow-md shadow-slate-200"
                                        : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hadith List */}
                <div className="space-y-4">
                    {filteredHadiths.map(hadith => (
                        <Card key={hadith.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group bg-white">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-1 bg-violet-500 rounded-full"></div>
                                        <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">{hadith.source}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 rounded-full">
                                            <Heart className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <p className="font-amiri text-xl mb-3 text-slate-800 leading-loose" dir="rtl">
                                    {hadith.arabic}
                                </p>

                                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                    "{hadith.text}"
                                </p>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                        <User className="w-3 h-3" />
                                        <span>{hadith.narrator}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-slate-400 hover:text-slate-800">
                                            <Copy className="w-3 h-3 mr-1" /> Copy
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-slate-400 hover:text-slate-800">
                                            <Share2 className="w-3 h-3 mr-1" /> Share
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredHadiths.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-slate-400 text-sm">No hadith found matching your search.</p>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}
