import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { AppFooter } from "@/components/app-footer";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const baseUrl =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : typeof process !== "undefined" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "FediChess - Play Free Online",
  description: "Play chess peer-to-peer, no servers. Free multiplayer over WebRTC.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "FediChess - Play Free Online",
    description: "Play chess peer-to-peer, no servers. Free multiplayer over WebRTC.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FediChess - Play Free Online",
    description: "Play chess peer-to-peer, no servers. Free multiplayer over WebRTC.",
  },
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
        <link rel="icon" href="/icon.png" type="image/png" sizes="48x48" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=typeof document!=='undefined'&&document.documentElement;if(!s)return;var p=typeof localStorage!=='undefined'?localStorage.getItem('p2p-chess-theme-pref'):null;var d=typeof matchMedia!=='undefined'&&matchMedia('(prefers-color-scheme: dark)').matches;var t=p==='light'||p==='dark'?p:(d?'dark':'light');s.classList.add(t);})();`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased bg-background text-foreground font-sans">
        <ErrorBoundary>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
              <AppFooter />
            </div>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
