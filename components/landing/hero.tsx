"use client";

/** Landing hero: title, Play Random / Copy Link / Local AI, theme toggles. */
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store";
import { useUIStore } from "@/lib/store";
import { getShareableLink } from "@/lib/p2p";
import { LOBBY_ROOM } from "@/lib/constants";
import { useTheme } from "@/components/theme-provider";

export function Hero() {
  const { elo, hydrateFromStorage } = useUserStore();
  const { theme: chessTheme, setTheme: setChessTheme } = useUIStore();
  const { theme: colorTheme, setTheme: setColorTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const handleCopyLink = React.useCallback(() => {
    const link = getShareableLink(LOBBY_ROOM, elo);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [elo]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Secondary actions in a compact tray: one primary focus (Play) below */}
      <div className="absolute top-4 right-4 flex gap-2 rounded-lg border border-border/50 bg-background/80 px-2 py-1.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setColorTheme(colorTheme === "dark" ? "light" : "dark")}
          className="rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Toggle theme"
        >
          {colorTheme === "dark" ? "☀️" : "🌙"}
        </button>
        <button
          type="button"
          onClick={() =>
            setChessTheme(chessTheme === "neon" ? "classic" : "neon")
          }
          className="rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Toggle chess theme"
        >
          {chessTheme === "neon" ? "♟ Classic" : "✨ Neon"}
        </button>
      </div>

      <h1 className="font-instrument text-4xl font-bold tracking-tight md:text-5xl">
        FediChess
      </h1>
      <p className="mt-2 text-muted-foreground">
        No servers. Peer-to-peer over WebRTC. Match with players near your ELO.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Button size="lg" asChild className="transition-transform duration-200 hover:scale-[1.02]">
          <Link href={`/lobby?room=${encodeURIComponent(LOBBY_ROOM)}#elo=${elo}`}>
            Play Random
          </Link>
        </Button>
        <Button variant="outline" size="lg" onClick={handleCopyLink}>
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button variant="secondary" size="lg" asChild>
          <Link href="/local">Local AI</Link>
        </Button>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Open in 2 tabs to test · Or share the link with a friend
      </p>
    </main>
  );
}
