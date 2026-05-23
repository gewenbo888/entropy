import type { Metadata } from "next";
import Script from "next/script";
import {
  Cinzel,
  Cormorant_Garamond,
  Space_Grotesk,
  JetBrains_Mono,
  Noto_Serif_SC,
} from "next/font/google";
import "./globals.css";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});
const han = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-han",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://entropy.psyverse.fun"),
  title: "ENTROPY · 熵 — The Ultimate Direction of the Universe",
  description:
    "A bilingual cinematic cathedral dedicated to entropy — thermodynamics, statistical mechanics, information theory, cosmology, black holes, life as negentropy, AI, and the heat death of the universe. The universe remembers order only by destroying it.",
  keywords: [
    "entropy", "熵", "thermodynamics", "热力学", "second law of thermodynamics",
    "arrow of time", "时间之箭", "Boltzmann", "玻尔兹曼", "Shannon information",
    "信息熵", "heat death", "热寂", "black hole entropy", "黑洞熵",
    "Bekenstein-Hawking", "negentropy", "负熵", "Prigogine", "dissipative structures",
    "cosmology", "宇宙学", "statistical mechanics", "AI entropy", "consciousness",
    "意识", "civilization collapse", "digital eternity", "psyverse",
  ],
  authors: [{ name: "Gewenbo", url: "https://psyverse.fun" }],
  alternates: {
    canonical: "/",
    languages: { en: "/", "zh-CN": "/", "x-default": "/" },
  },
  openGraph: {
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "ENTROPY · 熵 — The universe remembers order only by destroying it.",
      },
    ],
    title: "ENTROPY · 熵 — The Ultimate Direction of the Universe",
    description:
      "The universe remembers order only by destroying it. A cinematic, bilingual journey through thermodynamics, time, information, life, black holes, AI, and the heat death of everything.",
    url: "https://entropy.psyverse.fun/",
    siteName: "Psyverse",
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
  },
  twitter: {
    images: ["/twitter-image.png"],
    card: "summary_large_image",
    title: "ENTROPY · 熵",
    description:
      "The universe remembers order only by destroying it. 宇宙通过毁灭秩序来记忆时间。",
  },
  robots: { index: true, follow: true },
  other: { "theme-color": "#03030a" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${serif.variable} ${sans.variable} ${mono.variable} ${han.variable}`}
    >
      <body className="noise antialiased">
        {children}
        <Script
          src="https://analytics-dashboard-two-blue.vercel.app/tracker.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
