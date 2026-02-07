/**
 * Build a PGN string from game data for export and sharing (e.g. Lichess/Chess.com).
 */
export type GameResult = "win" | "loss" | "draw" | null;

export function buildPgn(params: {
  moveHistory: string[];
  result: GameResult;
  whiteName: string;
  blackName: string;
  fen?: string;
}): string {
  const { moveHistory, result, whiteName, blackName } = params;
  const date = new Date().toISOString().slice(0, 10);
  const pgnResult =
    result === "win"
      ? "1-0"
      : result === "loss"
        ? "0-1"
        : result === "draw"
          ? "1/2-1/2"
          : "*";

  const headers = [
    `[Event "P2P Chess Game"]`,
    `[Site "P2P Chess"]`,
    `[Date "${date}"]`,
    `[White "${escapePgnString(whiteName)}"]`,
    `[Black "${escapePgnString(blackName)}"]`,
    `[Result "${pgnResult}"]`,
  ].join("\n");

  const movetext = formatMoveHistory(moveHistory);
  return `${headers}\n\n${movetext} ${pgnResult}`.trim();
}

function escapePgnString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatMoveHistory(moves: string[]): string {
  const parts: string[] = [];
  let moveNumber = 1;
  for (let i = 0; i < moves.length; i += 2) {
    const white = moves[i];
    const black = moves[i + 1];
    parts.push(`${moveNumber}. ${white}${black ? ` ${black}` : ""}`);
    moveNumber += 1;
  }
  return parts.join(" ");
}

/**
 * URL to open the current position or game in Lichess analysis board.
 */
export function lichessAnalysisUrl(pgn: string): string {
  const base = "https://lichess.org/analysis";
  return `${base}?pgn=${encodeURIComponent(pgn)}`;
}
