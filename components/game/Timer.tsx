"use client";

import * as React from "react";

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TimerProps {
  whiteTimeMs: number;
  blackTimeMs: number;
  turn: "w" | "b";
  onTimeUp?: (color: "w" | "b") => void;
  active: boolean;
}

export function GameTimer({
  whiteTimeMs,
  blackTimeMs,
  turn,
  onTimeUp,
  active,
}: TimerProps) {
  const [white, setWhite] = React.useState(whiteTimeMs);
  const [black, setBlack] = React.useState(blackTimeMs);

  React.useEffect(() => {
    setWhite(whiteTimeMs);
    setBlack(blackTimeMs);
  }, [whiteTimeMs, blackTimeMs]);

  React.useEffect(() => {
    if (!active || !onTimeUp) return;
    const iv = setInterval(() => {
      if (turn === "w") {
        setWhite((prev) => {
          if (prev <= 1000) {
            onTimeUp("w");
            return 0;
          }
          return prev - 1000;
        });
      } else {
        setBlack((prev) => {
          if (prev <= 1000) {
            onTimeUp("b");
            return 0;
          }
          return prev - 1000;
        });
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [turn, active, onTimeUp]);

  return (
    <div className="flex gap-4">
      <div
        className={`px-3 py-1 rounded font-mono ${
          turn === "w" && active ? "bg-primary/20 ring-1 ring-primary" : "bg-muted"
        }`}
      >
        ♔ {formatMs(white)}
      </div>
      <div
        className={`px-3 py-1 rounded font-mono ${
          turn === "b" && active ? "bg-primary/20 ring-1 ring-primary" : "bg-muted"
        }`}
      >
        ♚ {formatMs(black)}
      </div>
    </div>
  );
}
