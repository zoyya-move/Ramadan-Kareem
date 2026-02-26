import { ApiResponse, PrayerData } from "@/types";

const ALADHAN_API_BASE_URL = "https://api.aladhan.com/v1";

export async function getPrayerTimes(city: string, country: string, lat?: number, long?: number): Promise<PrayerData | null> {
    try {
        const timestamp = Math.floor(Date.now() / 1000);
        // Method 20 is Kemenag (Ministry of Religious Affairs of Indonesia)
        let url = `${ALADHAN_API_BASE_URL}/timingsByCity/${timestamp}?city=${city}&country=${country}&method=20`;

        if (lat && long) {
            url = `${ALADHAN_API_BASE_URL}/timings/${timestamp}?latitude=${lat}&longitude=${long}&method=20`;
        }

        const response = await fetch(url, { next: { revalidate: 3600 } });

        if (!response.ok) {
            throw new Error("Failed to fetch prayer times");
        }

        const data: ApiResponse = await response.json();

        // Manual override for Ramadan 2026 (1447H)
        // User specified: 1 Ramadan = 19 Feb 2026
        const today = new Date();
        const jakartaTime = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
        const currentYear = jakartaTime.getFullYear();
        const currentMonth = jakartaTime.getMonth(); // 0-indexed (1 is Feb)
        const currentDate = jakartaTime.getDate();

        // Check if we are in the zone of Ramadan 2026 (Feb/March 2026)
        // 1 Ramadan = 19 Feb.
        // Feb 19 to Feb 28 = 10 days (19, 20, ..., 28) -> Ramadan 1 to 10
        // March 1 -> Ramadan 11, etc.

        let ramadanDay = 0;

        if (currentYear === 2026) {
            if (currentMonth === 1) { // February
                if (currentDate >= 19) {
                    ramadanDay = currentDate - 18; // 19 - 18 = 1
                }
            } else if (currentMonth === 2) { // March
                // Days in Feb 2026 = 28
                const daysInFeb = 28;
                const daysFromFeb = daysInFeb - 18; // 10 days
                ramadanDay = daysFromFeb + currentDate;
            }
        }

        if (ramadanDay > 0 && ramadanDay <= 30) {
            // Override the Hijri date
            if (data && data.data && data.data.date && data.data.date.hijri) {
                data.data.date.hijri.day = String(ramadanDay);
                data.data.date.hijri.month.en = "Ramadan";
                data.data.date.hijri.month.number = 9;

                // Also update the readable string slightly if it exists, though UI uses .day and .month.en
                data.data.date.readable = `${ramadanDay} Ramadan 1447`;
            }
        }

        return data.data;
    } catch (error) {
        console.error("Error fetching prayer times:", error);
        return null;
    }
}

export async function getHijriDate(date: string): Promise<string | null> {
    // Implementation to fetch Hijri date if needed separately, 
    // but getPrayerTimes already includes it.
    return null;
}
