"use client";

import { useEffect, useState } from "react";
import { getAllSurahs, Surah } from "@/lib/quranApi";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import LastReadCard from "@/components/LastReadCard";

export default function QuranPage() {
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchSurahs() {
            const data = await getAllSurahs();
            setSurahs(data);
            setFilteredSurahs(data);
            setLoading(false);
        }
        fetchSurahs();
    }, []);

    useEffect(() => {
        const lower = search.toLowerCase();
        const filtered = surahs.filter(
            (s) =>
                s.englishName.toLowerCase().includes(lower) ||
                s.englishNameTranslation.toLowerCase().includes(lower) ||
                s.name.includes(search) || // Arabic search might need exact match
                s.number.toString().includes(lower)
        );
        setFilteredSurahs(filtered);
    }, [search, surahs]);

    return (
        <main className="min-h-screen bg-background text-foreground pb-24">
            <div className="max-w-md mx-auto px-4 pt-8">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-primary font-serif mb-2">
                        Al-Quran
                    </h1>
                    <p className="text-muted-foreground text-sm mb-4">
                        Read and reflect upon the holy verses.
                    </p>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Surah..."
                            className="pl-9 bg-card border-border focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </header>

                <LastReadCard />

                <div className="space-y-3">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full bg-card rounded-lg" />
                        ))
                    ) : (
                        filteredSurahs.map((surah) => (
                            <Link href={`/quran/${surah.number}`} key={surah.number}>
                                <Card className="bg-card border-border hover:bg-muted/50 transition-colors cursor-pointer group mb-3 shadow-sm">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono group-hover:bg-primary group-hover:text-white transition-colors">
                                                {surah.number}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {surah.englishName}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {surah.englishNameTranslation} • {surah.numberOfAyahs} Verses
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-amiri text-xl text-muted-foreground group-hover:text-primary transition-colors">
                                                {surah.name}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
            <BottomNav />
        </main>
    );
}
