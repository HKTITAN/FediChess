/**
 * Global client state: user (ELO, name), lobby (peers, challenges), game (board, log, timers), UI (theme).
 * Zustand store; game state is synced via P2P event log (see documentation/architecture.md).
 */
import { create } from "zustand";
import { DEFAULT_ELO } from "./constants";
import { getGameStatus } from "./chess-engine";
import type { GameLogEvent } from "./p2p";

export type ChessTheme = "classic" | "neon";
export type GameResult = "win" | "loss" | "draw" | null;

interface UserState {
  elo: number;
  peakElo: number;
  name: string;
  peerId: string | null;
  setElo: (elo: number) => void;
  setPeakElo: (peak: number) => void;
  setName: (name: string) => void;
  setPeerId: (id: string | null) => void;
  hydrateFromStorage: () => Promise<void>;
}

interface LobbyState {
  peers: Array<{
    id: string;
    elo: number;
    name: string;
    ready: boolean;
    timestamp: number;
  }>;
  pendingChallenge: {
    gameId: string;
    challengerId: string;
    challengerName: string;
    challengerElo: number;
    color: "w" | "b";
  } | null;
  setPeers: (peers: LobbyState["peers"]) => void;
  addOrUpdatePeer: (peer: LobbyState["peers"][0]) => void;
  removePeer: (id: string) => void;
  setPendingChallenge: (c: LobbyState["pendingChallenge"]) => void;
  clearPendingChallenge: () => void;
}

interface GameState {
  gameId: string | null;
  roomId: string | null;
  fen: string;
  myColor: "w" | "b" | null;
  opponentId: string | null;
  opponentName: string | null;
  opponentElo: number | null;
  whitePeerId: string | null;
  blackPeerId: string | null;
  result: GameResult;
  moveHistory: string[];
  gameEventLog: GameLogEvent[];
  chatMessages: Array<{ peerId: string; text: string; timestamp: number }>;
  whiteTimeMs: number;
  blackTimeMs: number;
  drawOfferFrom: string | null;
  setGame: (params: {
    gameId: string;
    roomId: string;
    fen: string;
    myColor: "w" | "b" | null;
    opponentId: string | null;
    opponentName: string | null;
    opponentElo: number | null;
  }) => void;
  setFen: (fen: string) => void;
  addMove: (san: string) => void;
  setResult: (r: GameResult) => void;
  setGameEventLog: (events: GameLogEvent[]) => void;
  appendGameLogEvent: (event: GameLogEvent) => void;
  setWhitePeerId: (id: string | null) => void;
  setBlackPeerId: (id: string | null) => void;
  addChatMessage: (peerId: string, text: string) => void;
  setWhiteTime: (ms: number) => void;
  setBlackTime: (ms: number) => void;
  setDrawOfferFrom: (peerId: string | null) => void;
  resetGame: () => void;
}

interface UIState {
  theme: ChessTheme;
  soundEnabled: boolean;
  setTheme: (t: ChessTheme) => void;
  setSoundEnabled: (v: boolean) => void;
}

const defaultFen =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function replayGameLog(
  events: GameLogEvent[],
  myColor: "w" | "b" | null
): {
  fen: string;
  moveHistory: string[];
  result: GameResult;
  drawOfferFrom: string | null;
} {
  let fen = defaultFen;
  const moveHistory: string[] = [];
  let result: GameResult = null;
  let drawOfferFrom: string | null = null;
  for (const e of events) {
    if (e.kind === "move") {
      fen = e.fen;
      if (e.san) moveHistory.push(e.san);
    } else if (e.kind === "resign") {
      const st = getGameStatus(fen);
      const resignerTurn = st.turn;
      if (myColor) result = resignerTurn === myColor ? "loss" : "win";
      break;
    } else if (e.kind === "drawAccept") {
      result = "draw";
      drawOfferFrom = null;
      break;
    } else if (e.kind === "drawDecline") {
      drawOfferFrom = null;
    }
  }
  return { fen, moveHistory, result, drawOfferFrom };
}

export const useUserStore = create<UserState>((set) => ({
  elo: DEFAULT_ELO,
  peakElo: DEFAULT_ELO,
  name: "Player",
  peerId: null,
  setElo: (elo) => set({ elo }),
  setPeakElo: (peakElo) => set({ peakElo }),
  setName: (name) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("p2p-chess-name", name);
      } catch {
        // ignore
      }
    }
    set({ name });
  },
  setPeerId: (peerId) => set({ peerId }),
  hydrateFromStorage: async () => {
    if (typeof window === "undefined") return;
    try {
      const name = localStorage.getItem("p2p-chess-name");
      if (name) set({ name });
      const { getEloRecord } = await import("./elo");
      const record = await getEloRecord();
      set({ elo: record.elo, peakElo: record.peakElo });
    } catch {
      // ignore
    }
  },
}));

export const useLobbyStore = create<LobbyState>((set, get) => ({
  peers: [],
  pendingChallenge: null,
  setPeers: (peers) => set({ peers }),
  addOrUpdatePeer: (peer) => {
    set((s) => {
      const exists = s.peers.findIndex((p) => p.id === peer.id);
      let next = [...s.peers];
      if (exists >= 0) {
        next[exists] = peer;
      } else {
        next = [...next, peer];
      }
      next.sort((a, b) => Math.abs(a.elo - 1200) - Math.abs(b.elo - 1200));
      return { peers: next };
    });
  },
  removePeer: (id) =>
    set((s) => ({ peers: s.peers.filter((p) => p.id !== id) })),
  setPendingChallenge: (pendingChallenge) => set({ pendingChallenge }),
  clearPendingChallenge: () => set({ pendingChallenge: null }),
}));

export const useGameStore = create<GameState>((set, get) => ({
  gameId: null,
  roomId: null,
  fen: defaultFen,
  myColor: null,
  opponentId: null,
  opponentName: null,
  opponentElo: null,
  whitePeerId: null,
  blackPeerId: null,
  result: null,
  moveHistory: [],
  gameEventLog: [],
  chatMessages: [],
  whiteTimeMs: 5 * 60 * 1000,
  blackTimeMs: 5 * 60 * 1000,
  drawOfferFrom: null,
  setGame: (params) =>
    set({
      ...params,
      whitePeerId: null,
      blackPeerId: null,
      moveHistory: [],
      gameEventLog: [],
      chatMessages: [],
      result: null,
      whiteTimeMs: 5 * 60 * 1000,
      blackTimeMs: 5 * 60 * 1000,
      drawOfferFrom: null,
    }),
  setFen: (fen) => set({ fen }),
  addMove: (san) =>
    set((s) => ({ moveHistory: [...s.moveHistory, san] })),
  setResult: (result) => set({ result }),
  setGameEventLog: (events) =>
    set((s) => {
      const { fen, moveHistory, result, drawOfferFrom } = replayGameLog(events, s.myColor);
      return { gameEventLog: events, fen, moveHistory, result, drawOfferFrom };
    }),
  appendGameLogEvent: (event) =>
    set((s) => {
      const nextSeq = s.gameEventLog.length + 1;
      if (event.seq !== nextSeq) return {};
      const nextLog = [...s.gameEventLog, event];
      const { fen, moveHistory, result, drawOfferFrom } = replayGameLog(nextLog, s.myColor);
      return { gameEventLog: nextLog, fen, moveHistory, result, drawOfferFrom };
    }),
  setWhitePeerId: (whitePeerId) => set({ whitePeerId }),
  setBlackPeerId: (blackPeerId) => set({ blackPeerId }),
  addChatMessage: (peerId, text) =>
    set((s) => ({
      chatMessages: [
        ...s.chatMessages,
        { peerId, text, timestamp: Date.now() },
      ],
    })),
  setWhiteTime: (whiteTimeMs) => set({ whiteTimeMs }),
  setBlackTime: (blackTimeMs) => set({ blackTimeMs }),
  setDrawOfferFrom: (drawOfferFrom) => set({ drawOfferFrom }),
  resetGame: () =>
    set({
      gameId: null,
      roomId: null,
      fen: defaultFen,
      myColor: null,
      opponentId: null,
      opponentName: null,
      opponentElo: null,
      whitePeerId: null,
      blackPeerId: null,
      result: null,
      moveHistory: [],
      gameEventLog: [],
      chatMessages: [],
      whiteTimeMs: 5 * 60 * 1000,
      blackTimeMs: 5 * 60 * 1000,
      drawOfferFrom: null,
    }),
}));

export const useUIStore = create<UIState>((set) => {
  if (typeof window !== "undefined") {
    try {
      const theme = localStorage.getItem("p2p-chess-theme") as ChessTheme | null;
      const sound = localStorage.getItem("p2p-chess-sound");
      return {
        theme: theme === "neon" ? "neon" : "classic",
        soundEnabled: sound !== "false",
        setTheme: (theme) => {
          localStorage.setItem("p2p-chess-theme", theme);
          set({ theme });
        },
        setSoundEnabled: (soundEnabled) => {
          localStorage.setItem("p2p-chess-sound", String(soundEnabled));
          set({ soundEnabled });
        },
      };
    } catch {
      // ignore
    }
  }
  return {
    theme: "classic",
    soundEnabled: true,
    setTheme: (theme) => set({ theme }),
    setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  };
});
