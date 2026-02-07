import { get, set } from "idb-keyval";
import { DEFAULT_ELO } from "./constants";

const ELO_DB_KEY = "p2p-chess-elo";
const HISTORY_DB_KEY = "p2p-chess-history";
const PEAK_ELO_KEY = "p2p-chess-peak-elo";
const SCHEMA_VERSION = 1;

export interface EloRecord {
  elo: number;
  peakElo: number;
  wins: number;
  losses: number;
  draws: number;
  lastUpdated: number;
}

export interface GameHistoryEntry {
  id: string;
  result: "win" | "loss" | "draw";
  eloBefore: number;
  eloChange: number;
  opponentElo?: number;
  fen?: string;
  timestamp: number;
}

function eloDelta(
  myElo: number,
  opponentElo: number,
  score: number
): number {
  const k = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentElo - myElo) / 400));
  return Math.round(k * (score - expected));
}

export function calculateEloChange(
  myElo: number,
  opponentElo: number,
  result: "win" | "loss" | "draw"
): number {
  const score = result === "win" ? 1 : result === "loss" ? 0 : 0.5;
  return eloDelta(myElo, opponentElo, score);
}

export async function getEloRecord(): Promise<EloRecord> {
  try {
    const raw = await get<unknown>(ELO_DB_KEY);
    if (raw && typeof raw === "object" && "elo" in raw) {
      const r = raw as EloRecord;
      return {
        elo: r.elo ?? DEFAULT_ELO,
        peakElo: r.peakElo ?? r.elo ?? DEFAULT_ELO,
        wins: r.wins ?? 0,
        losses: r.losses ?? 0,
        draws: r.draws ?? 0,
        lastUpdated: r.lastUpdated ?? 0,
      };
    }
  } catch {
    // ignore
  }
  return {
    elo: DEFAULT_ELO,
    peakElo: DEFAULT_ELO,
    wins: 0,
    losses: 0,
    draws: 0,
    lastUpdated: 0,
  };
}

export async function updateEloAfterGame(
  currentElo: number,
  opponentElo: number,
  result: "win" | "loss" | "draw",
  gameId: string,
  fen?: string
): Promise<EloRecord> {
  const change = calculateEloChange(currentElo, opponentElo, result);
  const newElo = Math.max(100, currentElo + change);

  const record = await getEloRecord();
  const peakElo = Math.max(record.peakElo, newElo);

  const updated: EloRecord = {
    elo: newElo,
    peakElo,
    wins: record.wins + (result === "win" ? 1 : 0),
    losses: record.losses + (result === "loss" ? 1 : 0),
    draws: record.draws + (result === "draw" ? 1 : 0),
    lastUpdated: Date.now(),
  };

  await set(ELO_DB_KEY, updated);

  const historyEntry: GameHistoryEntry = {
    id: gameId,
    result,
    eloBefore: currentElo,
    eloChange: change,
    opponentElo,
    fen,
    timestamp: Date.now(),
  };

  const history = await getHistory();
  history.unshift(historyEntry);
  await set(HISTORY_DB_KEY, history.slice(0, 100));

  return updated;
}

export async function getHistory(): Promise<GameHistoryEntry[]> {
  try {
    const raw = await get<unknown>(HISTORY_DB_KEY);
    if (Array.isArray(raw)) return raw as GameHistoryEntry[];
  } catch {
    // ignore
  }
  return [];
}
