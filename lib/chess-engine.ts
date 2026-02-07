/**
 * Chess game logic: create game, apply moves, derive FEN and game status.
 * Uses chess.js for rules; exports types and helpers for the board and P2P event log.
 */
import { Chess } from "chess.js";

export type PieceSymbol = "p" | "n" | "b" | "r" | "q" | "k";
export type Color = "w" | "b";

export interface MoveResult {
  success: boolean;
  san?: string;
  fen: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isStalemate?: boolean;
  isDraw?: boolean;
}

const DEFAULT_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function createGame(fen?: string): Chess {
  try {
    const game = new Chess();
    if (fen && fen !== DEFAULT_FEN) {
      game.load(fen);
    }
    return game;
  } catch {
    return new Chess();
  }
}

export function validateFen(fen: string): boolean {
  try {
    const game = new Chess();
    game.load(fen);
    return true;
  } catch {
    return false;
  }
}

export function makeMove(
  fen: string,
  from: string,
  to: string,
  promotion?: PieceSymbol
): MoveResult {
  try {
    const game = new Chess(fen);
    const move = game.move({
      from,
      to,
      promotion: promotion ?? "q",
    });
    if (!move) {
      return { success: false, fen };
    }
    return {
      success: true,
      san: move.san,
      fen: game.fen(),
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isStalemate: game.isStalemate(),
      isDraw: game.isDraw(),
    };
  } catch {
    return { success: false, fen };
  }
}

export function getGameStatus(fen: string): {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  turn: Color;
} {
  try {
    const game = new Chess(fen);
    return {
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isStalemate: game.isStalemate(),
      isDraw: game.isDraw(),
      turn: game.turn() as Color,
    };
  } catch {
    return {
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      isDraw: false,
      turn: "w",
    };
  }
}

export function getHistoryFromFen(fen: string): string[] {
  try {
    const game = new Chess(fen);
    return game.history();
  } catch {
    return [];
  }
}
