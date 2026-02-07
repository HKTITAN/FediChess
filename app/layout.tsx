import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FediChess - Play Free Online",
  description: "Play chess peer-to-peer, no servers. Free multiplayer over WebRTC.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={instrumentSerif.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=typeof document!=='undefined'&&document.documentElement;if(!s)return;var p=typeof localStorage!=='undefined'?localStorage.getItem('p2p-chess-theme-pref'):null;var d=typeof matchMedia!=='undefined'&&matchMedia('(prefers-color-scheme: dark)').matches;var t=p==='light'||p==='dark'?p:(d?'dark':'light');s.classList.add(t);})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-background text-foreground font-sans">
        <ErrorBoundary>
          <ThemeProvider>{children}</ThemeProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
