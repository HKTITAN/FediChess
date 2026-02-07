"use client";

/** Landing hero: title, Play Random / Copy Link / Local AI, theme toggles. */
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store";
import { useUIStore } from "@/lib/store";
import { getShareableLink } from "@/lib/p2p";
import { copyToClipboard } from "@/lib/clipboard";
import { LOBBY_ROOM } from "@/lib/constants";
import { useTheme } from "@/components/theme-provider";

export function Hero() {
  const { elo, hydrateFromStorage } = useUserStore();
  const { theme: chessTheme, setTheme: setChessTheme } = useUIStore();
  const { theme: colorTheme, setTheme: setColorTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);
  const [copyFailed, setCopyFailed] = React.useState(false);

  React.useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const handleCopyLink = React.useCallback(async () => {
    const link = getShareableLink(LOBBY_ROOM, elo);
    if (!link) return;
    setCopyFailed(false);
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  }, [elo]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      {/* Secondary actions in a compact tray: one primary focus (Play) below */}
      <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-background/80 px-2 py-1.5 backdrop-blur-sm">
        <Link
          href="/settings"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Backup
        </Link>
        <button
          type="button"
          onClick={() => setColorTheme(colorTheme === "dark" ? "light" : "dark")}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Toggle theme"
        >
          {colorTheme === "dark" ? "☀️" : "🌙"}
        </button>
        <button
          type="button"
          onClick={() =>
            setChessTheme(chessTheme === "neon" ? "classic" : "neon")
          }
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Toggle chess theme"
        >
          {chessTheme === "neon" ? "♟ Classic" : "✨ Neon"}
        </button>
      </div>

      <div className="mx-auto w-full max-w-2xl text-center">
        <h1 className="font-instrument text-4xl font-bold tracking-tight md:text-5xl">
          FediChess
        </h1>
        <p className="mt-2 text-muted-foreground text-sm sm:text-base">
          No servers. Peer-to-peer over WebRTC. Match with players near your ELO.
        </p>
      </div>

      <div className="mt-8 flex w-full max-w-md flex-col gap-4 sm:flex-row sm:justify-center">
        <Button size="lg" asChild className="min-h-[44px] min-w-[44px] transition-transform duration-200 hover:scale-[1.02]">
          <Link href={`/lobby?room=${encodeURIComponent(LOBBY_ROOM)}#elo=${elo}`}>
            Play Random
          </Link>
        </Button>
        <Button variant="outline" size="lg" onClick={handleCopyLink} className="min-h-[44px] min-w-[44px]">
          {copied ? "Copied!" : copyFailed ? "Copy failed" : "Copy Link"}
        </Button>
        <Button variant="secondary" size="lg" asChild className="min-h-[44px] min-w-[44px]">
          <Link href="/local">Local AI</Link>
        </Button>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Open in 2 tabs to test · Or share the link with a friend
      </p>
    </main>
  );
}
