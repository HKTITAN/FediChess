"use client";

/** Game board: react-chessboard wrapper with FEN, orientation, move callback, and classic/neon theme. */
import * as React from "react";
import { Chessboard } from "react-chessboard";
import { makeMove, validateFen, getGameStatus } from "@/lib/chess-engine";

interface ChessBoardProps {
  fen: string;
  orientation?: "white" | "black";
  onMove?: (fen: string, san?: string) => void;
  disabled?: boolean;
  theme?: "classic" | "neon";
}

const lightSquareStyle = { backgroundColor: "#f0d9b5" };
const darkSquareStyle = { backgroundColor: "#b58863" };

const BOARD_MIN = 280;
const BOARD_MAX = 400;

export function GameChessBoard({
  fen,
  orientation = "white",
  onMove,
  disabled = false,
  theme = "classic",
}: ChessBoardProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = React.useState(BOARD_MAX);
  const [lastMove, setLastMove] = React.useState<{ from: string; to: string } | null>(null);

  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setBoardWidth((prev) => {
        const next = Math.min(BOARD_MAX, Math.max(BOARD_MIN, w));
        return next === prev ? prev : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onDrop = React.useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (!validateFen(fen) || disabled) return false;
      const result = makeMove(fen, sourceSquare, targetSquare);
      if (result.success) {
        setLastMove({ from: sourceSquare, to: targetSquare });
        onMove?.(result.fen, result.san);
        return true;
      }
      return false;
    },
    [fen, disabled, onMove]
  );

  const status = getGameStatus(fen);
  const isGameOver =
    status.isCheckmate || status.isStalemate || status.isDraw;

  const customSquareStyles = React.useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: "rgba(34, 197, 94, 0.4)",
      };
      styles[lastMove.to] = {
        backgroundColor: "rgba(34, 197, 94, 0.4)",
      };
    }
    return styles;
  }, [lastMove]);

  const customDarkSquareStyle =
    theme === "neon"
      ? { backgroundColor: "#0f172a" }
      : darkSquareStyle;
  const customLightSquareStyle =
    theme === "neon"
      ? { backgroundColor: "#1e293b" }
      : lightSquareStyle;

  return (
    <div
      ref={wrapperRef}
      className={
        theme === "neon" ? "theme-neon rounded-lg overflow-hidden w-full max-w-[400px]" : "w-full max-w-[400px]"
      }
    >
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={orientation}
        arePiecesDraggable={!disabled && !isGameOver}
        customSquareStyles={customSquareStyles}
        customDarkSquareStyle={customDarkSquareStyle}
        customLightSquareStyle={customLightSquareStyle}
        boardWidth={boardWidth}
        animationDuration={200}
      />
    </div>
  );
}
