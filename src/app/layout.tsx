import type { Metadata } from "next";
import { Inter, Fraunces, Yatra_One } from "next/font/google";
import "./globals.css";
import { LoadingGate } from "@/frontend/components/loading/LoadingGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const yatraOne = Yatra_One({
  variable: "--font-yatra-one",
  subsets: ["latin", "devanagari"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Spotle Bollywood — Guess today's mystery Hindi film",
  description:
    "A daily guess-the-movie game for Bollywood fans. Three difficulty tiers, ten guesses, color-coded clues.",
};

const themeInitScript = `
try {
  var stored = localStorage.getItem('theme');
  var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var dark = stored ? stored === 'dark' : sysDark;
  if (dark) document.documentElement.classList.add('dark');
} catch (_) {}
`.trim();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${yatraOne.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full antialiased">
        <LoadingGate>{children}</LoadingGate>
      </body>
    </html>
  );
}
