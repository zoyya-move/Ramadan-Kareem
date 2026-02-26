import type { Metadata } from "next";
import { Inter, Amiri_Quran } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const amiri = Amiri_Quran({
  subsets: ["arabic"],
  weight: "400",
  variable: "--font-amiri-quran",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ramadhan Kareem",
  description: "Track your prayers and fasting during the holy month of Ramadan.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${inter.variable} ${amiri.variable} font-sans antialiased bg-slate-50 text-slate-900`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
