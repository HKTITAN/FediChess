"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { makeMove, getGameStatus } from "@/lib/chess-engine";
import { useUIStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard),
  { ssr: false }
);

const INITIAL_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

async function getBestMove(fen: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  await new Promise((r) => setTimeout(r, 300));
  return getRandomMove(fen);
}

async function getRandomMove(fen: string): Promise<string | null> {
  try {
    const { Chess } = await import("chess.js");
    const game = new Chess(fen);
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    const m = moves[Math.floor(Math.random() * moves.length)];
    return m.from + m.to + (m.promotion ?? "");
  } catch {
    return null;
  }
}

export default function LocalAIPage() {
  const [mounted, setMounted] = React.useState(false);
  const [fen, setFen] = React.useState(INITIAL_FEN);
  const [thinking, setThinking] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const { theme: chessTheme } = useUIStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const status = getGameStatus(fen);
  const isPlayerTurn = status.turn === "w";

  const makeAIMove = React.useCallback(async () => {
    if (!isPlayerTurn || status.isCheckmate || status.isDraw) return;
    setThinking(true);
    const uci = await getBestMove(fen);
    setThinking(false);
    if (!uci) return;
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promo = uci.length === 5 ? (uci[4] as "q" | "r" | "b" | "n") : undefined;
    const moveResult = makeMove(fen, from, to, promo);
    if (moveResult.success) {
      setFen(moveResult.fen);
      if (moveResult.isCheckmate) setResult("You win!");
      else if (moveResult.isDraw || moveResult.isStalemate) setResult("Draw");
    }
  }, [fen, isPlayerTurn, status.isCheckmate, status.isDraw]);

  const onDrop = React.useCallback(
    (source: string, target: string) => {
      const moveResult = makeMove(fen, source, target);
      if (moveResult.success) {
        setFen(moveResult.fen);
        if (moveResult.isCheckmate) setResult("AI wins!");
        else if (moveResult.isDraw || moveResult.isStalemate) setResult("Draw");
        else setTimeout(makeAIMove, 300);
        return true;
      }
      return false;
    },
    [fen, makeAIMove]
  );

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <span className="text-sm text-muted-foreground">
            Play vs simple AI (random moves)
          </span>
        </div>

        {!mounted ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            Loading…
          </div>
        ) : (
          <>
            {result && (
              <div className="mb-4 rounded-lg bg-primary/20 p-4 text-center font-medium">
                {result}
              </div>
            )}

            <div className={chessTheme === "neon" ? "theme-neon" : ""}>
              <Chessboard
                position={fen}
                onPieceDrop={onDrop}
                boardOrientation="white"
                arePiecesDraggable={isPlayerTurn && !result && !thinking}
                boardWidth={400}
              />
            </div>

            {thinking && (
              <p className="mt-4 text-center text-muted-foreground">
                AI thinking…
              </p>
            )}

            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                className="min-h-[44px] min-w-[44px]"
                onClick={() => {
                  setFen(INITIAL_FEN);
                  setResult(null);
                }}
              >
                New Game
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
