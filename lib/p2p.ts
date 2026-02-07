/**
 * P2P layer: Trystero (torrent strategy), rooms, and action types/payloads for lobby and game.
 * Wire protocol is documented in documentation/protocol.md. Exports room helpers and payload types.
 */
import {
  P2P_APP_ID,
  P2P_TRACKERS,
  LOBBY_ROOM,
  NAT_RETRY_COUNT,
  getIceServers,
} from "./constants";

export type { Room } from "trystero/torrent";

// Action payload types
export interface HeartbeatPayload {
  id: string;
  elo: number;
  name: string;
  ready: boolean;
  timestamp: number;
}

export interface ChallengePayload {
  type: "challenge";
  gameId: string;
  challengerId: string;
  challengerName: string;
  challengerElo: number;
  color: "w" | "b";
  timestamp: number;
}

export interface ChallengeResponsePayload {
  type: "accept" | "decline";
  gameId: string;
  timestamp: number;
}

export interface MovePayload {
  type: "move";
  fen: string;
  san?: string;
  timestamp: number;
}

export interface ChatPayload {
  type: "chat";
  text: string;
  peerId: string;
  timestamp: number;
}

export interface GameEventPayload {
  type: "resign" | "drawOffer" | "drawAccept" | "drawDecline";
  timestamp: number;
}

export interface SyncPayload {
  type: "sync";
  fen: string;
  timestamp: number;
}

/** Single event in the shared game log (append-only, seq is version). */
export type GameLogEvent =
  | { seq: number; kind: "move"; fen: string; san?: string; timestamp: number }
  | { seq: number; kind: "resign"; timestamp: number }
  | { seq: number; kind: "drawOffer"; timestamp: number }
  | { seq: number; kind: "drawAccept"; timestamp: number }
  | { seq: number; kind: "drawDecline"; timestamp: number };

/** Payload for "history" action: one new event. */
export type HistoryPayload = GameLogEvent;

/** Payload for "histSync" action (≤12 bytes): full log for late joiners. */
export interface HistorySyncPayload {
  events: GameLogEvent[];
}

/** Payload for "role" action: announce player or spectator. */
export interface RolePayload {
  role: "player" | "spectator";
  color?: "w" | "b";
  peerId: string;
}

const TRACKERS = P2P_TRACKERS as unknown as string[];

let roomCache: Map<string, import("trystero/torrent").Room> = new Map();

export async function getRoom(roomId: string): Promise<import("trystero/torrent").Room> {
  const cached = roomCache.get(roomId);
  if (cached) return cached;

  const { joinRoom } = await import("trystero/torrent");
  const iceServers = getIceServers();
  const room = joinRoom(
    {
      appId: P2P_APP_ID,
      relayUrls: TRACKERS,
      relayRedundancy: Math.min(3, TRACKERS.length),
      ...(iceServers.length > 0 && { rtcConfig: { iceServers } }),
    },
    roomId
  );
  roomCache.set(roomId, room);
  return room;
}

export function leaveRoom(roomId: string): void {
  const room = roomCache.get(roomId);
  if (room) {
    room.leave();
    roomCache.delete(roomId);
  }
}

export async function getLobbyRoom(): Promise<import("trystero/torrent").Room> {
  return getRoom(LOBBY_ROOM);
}

export async function getGameRoom(gameId: string): Promise<import("trystero/torrent").Room> {
  return getRoom(`p2p-chess-${gameId}`);
}

export async function withNatRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number) => void
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= NAT_RETRY_COUNT; attempt++) {
    try {
      if (attempt > 0 && onRetry) onRetry(attempt);
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < NAT_RETRY_COUNT) {
        await new Promise((r) =>
          setTimeout(r, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
  throw lastError;
}

export function getShareableLink(roomId: string, elo: number): string {
  if (typeof window === "undefined") return "";
  const base = window.location.origin + window.location.pathname;
  return `${base}/lobby?room=${encodeURIComponent(roomId)}#elo=${elo}`;
}
