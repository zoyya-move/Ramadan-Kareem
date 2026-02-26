"use client";

import { useEffect, useState, useRef } from "react";
import { getSurahDetails, SurahDetails } from "@/lib/quranApi";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, Volume2, Pause, Play } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { syncUserData, getUserData } from "@/lib/db";

// Helper to get font class based on script type if needed, but standard Amiri is good.
// Bismillah pre-check
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export default function SurahDetail() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [surah, setSurah] = useState<{ arabic: SurahDetails; translation: SurahDetails } | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookmark, setBookmark] = useState<{ surahId: number; ayahNumber: number; surahName: string; totalAyahs?: number } | null>(null);
    const [memorized, setMemorized] = useState<number[]>([]);
    const [isMemorizationMode, setIsMemorizationMode] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentAyahAudio, setCurrentAyahAudio] = useState<number | null>(null); // Number in Surah

    // Audio ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio();
        // We'll set onended dynamically to access latest state/props if needed, 
        // but for now we need a way to know the *next* ayah.
        // simpler: handle next logic in a separate effect or use a ref for current index.
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Effect to handle auto-play when currentAyahAudio changes is tricky because we trigger it manually too.
    // Instead, let's attach the onended listener properly when we play.

    const playNextAyah = (currentNumber: number) => {
        if (!surah || !surah.arabic.ayahs) return;
        const currentIndex = surah.arabic.ayahs.findIndex(a => a.numberInSurah === currentNumber);
        if (currentIndex !== -1 && currentIndex < surah.arabic.ayahs.length - 1) {
            const nextAyah = surah.arabic.ayahs[currentIndex + 1];
            // Use any cast because we know we added audio to the API
            const nextAudioUrl = (surah as any).audio.ayahs[currentIndex + 1].audio;
            toggleAudio(nextAyah.numberInSurah, nextAudioUrl);
        } else {
            setIsPlaying(false);
            setCurrentAyahAudio(null);
        }
    };

    useEffect(() => {
        // Load bookmark
        const saved = localStorage.getItem("quranBookmark");
        if (saved) {
            setBookmark(JSON.parse(saved));
        }

        // Sync from Firestore if logged in
        if (user) {
            getUserData(user.uid).then((data) => {
                if (data && data.quranBookmark) {
                    setBookmark(data.quranBookmark);
                    localStorage.setItem("quranBookmark", JSON.stringify(data.quranBookmark));
                }
            });
        }

        // Load memorized ayahs for this surah
        const savedMemorized = localStorage.getItem(`memorized-${id}`);
        if (savedMemorized) {
            setMemorized(JSON.parse(savedMemorized));
        }
    }, [id, user]);

    useEffect(() => {
        if (!id) return;
        async function fetchDetails() {
            const data: any = await getSurahDetails(id); // Cast to any to access audio for now or update interface local usage
            setSurah(data);
            setLoading(false);
        }
        fetchDetails();
    }, [id]);

    const toggleAudio = (ayahNumber: number, url: string) => {
        if (!audioRef.current) return;

        if (currentAyahAudio === ayahNumber && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (currentAyahAudio !== ayahNumber) {
                audioRef.current.src = url;
                setCurrentAyahAudio(ayahNumber);

                // Set up auto-play for next ayah
                audioRef.current.onended = () => {
                    playNextAyah(ayahNumber);
                };
            }
            audioRef.current.play();
            setIsPlaying(true);
        }
    };


    useEffect(() => {
        // Auto-scroll to bookmark if it exists in this surah
        if (!loading && surah && bookmark && bookmark.surahId === id) {
            setTimeout(() => {
                const element = document.getElementById(`ayah-${bookmark.ayahNumber}`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                    // Optional: Add a temporary highlight effect
                }
            }, 500); // Small delay to ensure rendering
        }
    }, [loading, surah, bookmark, id]);

    const toggleBookmark = (ayahNumber: number) => {
        if (!surah) return;
        const newBookmark = {
            surahId: id,
            ayahNumber,
            surahName: surah.arabic.englishName,
            totalAyahs: surah.arabic.numberOfAyahs
        };
        setBookmark(newBookmark);
        localStorage.setItem("quranBookmark", JSON.stringify(newBookmark));

        if (user) {
            syncUserData(user.uid, { quranBookmark: newBookmark });
        }
    };

    const toggleMemorized = (ayahNumber: number) => {
        let newMemorized;
        if (memorized.includes(ayahNumber)) {
            newMemorized = memorized.filter(n => n !== ayahNumber);
        } else {
            newMemorized = [...memorized, ayahNumber];
        }
        setMemorized(newMemorized);
        localStorage.setItem(`memorized-${id}`, JSON.stringify(newMemorized));
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-background text-foreground pb-24">
                <div className="max-w-md mx-auto px-4 pt-8">
                    <Skeleton className="h-8 w-1/3 bg-muted mb-6" />
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full bg-card rounded-lg" />
                        ))}
                    </div>
                </div>
            </main>
        )
    }

    if (!surah) return <div className="p-8 text-center text-destructive">Failed to load Surah.</div>;

    const memorizedCount = memorized.length;
    const progress = Math.round((memorizedCount / surah.arabic.numberOfAyahs) * 100);

    return (
        <main className="min-h-screen bg-background text-foreground pb-24">
            <div className="max-w-md mx-auto px-4 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-6 sticky top-0 bg-background/80 backdrop-blur-md py-4 z-10 border-b border-border">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{surah.arabic.englishName}</h1>
                            <p className="text-xs text-muted-foreground">{surah.arabic.englishNameTranslation} • {surah.arabic.numberOfAyahs} Verses</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMemorizationMode(!isMemorizationMode)}
                        className={`p-2 rounded-lg text-xs font-medium transition-all ${isMemorizationMode ? "bg-primary/10 text-primary border border-primary/20" : "bg-card text-muted-foreground border border-border"}`}
                    >
                        {isMemorizationMode ? "Practice Mode" : "Read Mode"}
                    </button>
                </div>

                {/* Bismillah (except for At-Tawbah) */}
                {id !== 9 && (
                    <div className="text-center mb-8 p-6 bg-card/50 rounded-xl border border-border">
                        <span className="font-amiri text-3xl text-primary leading-loose drop-shadow-sm">
                            {BISMILLAH}
                        </span>
                    </div>
                )}

                {/* Memorization Progress */}
                {memorizedCount > 0 && (
                    <div className="mb-6 bg-card rounded-lg p-3 border border-border shadow-sm">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Memorized</span>
                            <span className="text-primary font-medium">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                {/* Ayahs */}
                <div className="space-y-6">
                    {surah.arabic.ayahs.map((ayah, index) => {
                        const translationText = surah.translation.ayahs[index].text;
                        const isBookmarked = bookmark?.surahId === id && bookmark?.ayahNumber === ayah.numberInSurah;
                        const isMemorized = memorized.includes(ayah.numberInSurah);

                        return (
                            <div key={ayah.number} className="scroll-mt-48" id={`ayah-${ayah.numberInSurah}`}>
                                <Card className={`transition-all duration-500 border-2 shadow-sm ${isMemorized ? "bg-primary/5 border-primary/30" : "bg-card border-border"} ${isBookmarked ? "ring-2 ring-primary/50" : ""}`}>
                                    <CardContent className="p-5 space-y-4">
                                        {/* Header: Number & Actions */}
                                        <div className="flex justify-between items-start">
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-mono transition-colors ${isBookmarked ? "bg-primary text-white" : isMemorized ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                                {ayah.numberInSurah}
                                            </span>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleAudio(ayah.numberInSurah, (surah as any).audio.ayahs[index].audio)}
                                                    className={`p-2 rounded-full transition-colors ${currentAyahAudio === ayah.numberInSurah && isPlaying ? "text-primary bg-primary/10 animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-muted"}`}
                                                    title="Play Audio"
                                                >
                                                    {currentAyahAudio === ayah.numberInSurah && isPlaying ? (
                                                        <Pause className="w-4 h-4 fill-current" />
                                                    ) : (
                                                        <Play className="w-4 h-4 fill-current" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => toggleMemorized(ayah.numberInSurah)}
                                                    className={`p-2 rounded-full transition-colors ${isMemorized ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-muted"}`}
                                                    title={isMemorized ? "Memorized" : "Mark as Memorized"}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isMemorized ? "fill-current" : ""}>
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => toggleBookmark(ayah.numberInSurah)}
                                                    className={`p-2 rounded-full transition-colors ${isBookmarked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-muted"}`}
                                                    title={isBookmarked ? "Bookmarked" : "Bookmark as last read"}
                                                >
                                                    <BookOpen className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Arabic Text */}
                                        <div className="text-right group cursor-pointer" dir="rtl" onClick={() => isMemorizationMode && document.getElementById(`text-${ayah.number}`)?.classList.toggle("blur-md")}>
                                            <p
                                                id={`text-${ayah.number}`}
                                                className={`font-amiri text-3xl leading-[2.5] text-foreground transition-all duration-300 drop-shadow-sm ${isMemorizationMode && !isMemorized ? "blur-md select-none" : ""}`}
                                            >
                                                {ayah.text}
                                            </p>
                                        </div>

                                        {/* Translation */}
                                        <div className="pt-2 border-t border-border cursor-pointer" onClick={() => isMemorizationMode && document.getElementById(`trans-${ayah.number}`)?.classList.toggle("blur-sm")}>
                                            <p
                                                id={`trans-${ayah.number}`}
                                                className={`text-sm text-muted-foreground leading-relaxed transition-all duration-300 ${isMemorizationMode && !isMemorized ? "blur-sm select-none" : ""}`}
                                            >
                                                {translationText}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </div>
            <BottomNav />
        </main>
    );
}
