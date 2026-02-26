"use client";

import { useLastRead } from "@/hooks/useLastRead";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function LastReadCard() {
    const { bookmark, mounted } = useLastRead();

    if (!mounted) return null;

    if (!bookmark) {
        return (
            <Link href="/quran/1">
                <Card className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all cursor-pointer mb-6 group rounded-xl transform hover:-translate-y-0.5">
                    <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[150%] bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors pointer-events-none"></div>
                    <CardContent className="flex items-center justify-between p-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white group-hover:bg-white/30 transition-all shadow-inner">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-violet-200 font-bold uppercase tracking-wider mb-0.5">
                                    Start Reading
                                </p>
                                <h3 className="font-serif font-bold text-lg drop-shadow-sm leading-tight">
                                    Al-Fatiha
                                </h3>
                                <p className="text-xs text-violet-100/80 font-medium">
                                    The Opening
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <span className="text-white/80 font-bold text-xl">→</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        );
    }

    return (
        <Link href={`/quran/${bookmark.surahId}`}>
            <Card className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all cursor-pointer mb-6 group rounded-xl transform hover:-translate-y-0.5">
                <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[150%] bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors pointer-events-none"></div>
                <CardContent className="flex items-center justify-between p-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white group-hover:bg-white/30 transition-all shadow-inner">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-violet-200 font-bold uppercase tracking-wider mb-0.5">
                                Continue Reading
                            </p>
                            <h3 className="font-serif font-bold text-lg drop-shadow-sm leading-tight">
                                {bookmark.surahName}
                            </h3>
                            <p className="text-xs text-violet-100/80 font-medium">
                                Ayah {bookmark.ayahNumber}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <span className="text-white/80 font-bold text-xl">→</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
