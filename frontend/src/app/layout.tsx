import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";
import { CustomCursor } from "@/components/layout/CustomCursor";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://frontlinecollege.edu.ng"),
  title: {
    default: "Frontline College of Medical and Health Sciences",
    template: "%s · Frontline College",
  },
  description:
    "Frontline College of Medical and Health Sciences trains Nigeria's next generation of community health, public health and environmental health professionals. Admissions now open — apply online.",
  keywords: [
    "Frontline College",
    "health sciences college Abuja",
    "CHEW diploma",
    "public health technician Nigeria",
    "environmental health technology",
    "Kuje Abuja college",
  ],
  openGraph: {
    title: "Frontline College of Medical and Health Sciences",
    description: "Frontline in healthcare, excellence in training. Admissions now open.",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden bg-ice-50 text-ink">
        <SmoothScrollProvider>
          <CustomCursor />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
