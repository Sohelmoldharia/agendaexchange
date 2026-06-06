import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { TickerTape } from "@/components/TickerTape";
import { PathHide } from "@/components/PathHide";
import { getTapeData } from "@/lib/queries";
import { BRAND } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: BRAND.full, template: `%s · ${BRAND.name}` },
  description: BRAND.blurb,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tape = await getTapeData();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* FANDX chrome — hidden under /anime, which has its own shell. */}
        <PathHide prefix="/anime">
          <Nav />
          <TickerTape initial={tape} />
        </PathHide>
        <main className="flex-1">{children}</main>
        <PathHide prefix="/anime">
          <Footer />
        </PathHide>
      </body>
    </html>
  );
}
