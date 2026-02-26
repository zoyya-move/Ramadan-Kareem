const API_BASE_URL = "https://api.alquran.cloud/v1";

export interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

export interface Ayah {
    number: number;
    text: string;
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean;
    audio?: string; // Audio URL
    audioSecondary?: string[]; // Secondary audio URLs
}

export interface SurahDetails {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
    ayahs: Ayah[];
    edition: {
        identifier: string;
        language: string;
        name: string;
        englishName: string;
        format: string;
        type: string;
    }
}

export async function getAllSurahs(): Promise<Surah[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/surah`);
        if (!response.ok) throw new Error("Failed to fetch surahs");
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching surahs:", error);
        return [];
    }
}

export async function getSurahDetails(number: number): Promise<{ arabic: SurahDetails; translation: SurahDetails; audio: SurahDetails } | null> {
    try {
        // Fetch Arabic text, Indonesian translation, and Audio
        const response = await fetch(`${API_BASE_URL}/surah/${number}/editions/quran-uthmani,id.indonesian,ar.alafasy`);
        if (!response.ok) throw new Error("Failed to fetch surah details");
        const data = await response.json();

        return {
            arabic: data.data[0],
            translation: data.data[1],
            audio: data.data[2]
        };
    } catch (error) {
        console.error(`Error fetching surah ${number}:`, error);
        return null;
    }
}
