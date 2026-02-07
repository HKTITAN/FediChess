/**
 * P2P layer: Trystero (torrent strategy), rooms, and action types/payloads for lobby and game.
 * Wire protocol is documented in documentation/protocol.md. Exports room helpers and payload types.
 * Supports WebRTC (Trystero) and BLE transports; see lib/transport-types.ts for the Room interface.
 */
import {
  P2P_APP_ID,
  P2P_TRACKERS,
  LOBBY_ROOM,
  NAT_RETRY_COUNT,
  getIceServers,
} from "./constants";
import type { Room } from "./transport-types";
import {
  createBleRoom,
  getStoredBleGameRoom,
  setStoredBleGameRoom,
  clearStoredBleGameRoom,
} from "./ble-transport";

export type { Room } from "./transport-types";
export { isBleSupported, requestBleDevice, setStoredBleGameRoom, clearStoredBleGameRoom } from "./ble-transport";

/** Lobby: periodic presence (heartbeat action). */
export interface HeartbeatPayload {
  id: string;
  elo: number;
  name: string;
  ready: boolean;
  timestamp: number;
}

/** Lobby: challenge request (challenge action). */
export interface ChallengePayload {
  type: "challenge";
  gameId: string;
  challengerId: string;
  challengerName: string;
  challengerElo: number;
  color: "w" | "b";
  timestamp: number;
}

/** Lobby: accept or decline (challResp action). */
export interface ChallengeResponsePayload {
  type: "accept" | "decline";
  gameId: string;
  timestamp: number;
}

/** Game: move (move action). FEN must be valid standard FEN. */
export interface MovePayload {
  type: "move";
  fen: string;
  san?: string;
  timestamp: number;
}

/** Game: chat message (chat action). */
export interface ChatPayload {
  type: "chat";
  text: string;
  peerId: string;
  timestamp: number;
}

/** Game: resign or draw offer/accept/decline (gameEvent action). */
export interface GameEventPayload {
  type: "resign" | "drawOffer" | "drawAccept" | "drawDecline";
  timestamp: number;
}

/** Game: full FEN sync for new joiners (sync action). */
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

/**
 * Whether P2P (WebRTC) is supported in this environment.
 * Requires a secure context (HTTPS or localhost) with Web Crypto (crypto.subtle) for Trystero.
 */
export function isP2PSupported(): boolean {
  if (typeof window === "undefined") return false;
  const c = (window as Window & { crypto?: { subtle?: unknown } }).crypto;
  return Boolean(c?.subtle);
}

/**
 * Get or create a Trystero (WebRTC) room by ID. Rooms are cached per roomId.
 * Use getLobbyRoom() or getGameRoom(gameId) for standard room IDs.
 */
export async function getRoom(roomId: string): Promise<import("trystero/torrent").Room> {
  if (!isP2PSupported()) {
    throw new Error(
      "P2P requires a secure context (HTTPS or localhost) with Web Crypto. Please use HTTPS or open from localhost."
    );
  }

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

/** Leave a WebRTC room and remove it from the cache. */
export function leaveRoom(roomId: string): void {
  const room = roomCache.get(roomId);
  if (room) {
    room.leave();
    roomCache.delete(roomId);
  }
}

/** Get the default lobby room (p2p-chess-global). */
export async function getLobbyRoom(): Promise<import("trystero/torrent").Room> {
  return getRoom(LOBBY_ROOM);
}

/** Get the game room for the given gameId (p2p-chess-{gameId}). */
export async function getGameRoom(gameId: string): Promise<import("trystero/torrent").Room> {
  return getRoom(`p2p-chess-${gameId}`);
}

/**
 * BLE lobby: create a Room from a connected BLE device (one peer).
 * Call requestBleDevice() first to get the device, then pass it here.
 */
export async function getLobbyRoomBle(
  device: BluetoothDevice,
  selfPeerId?: string
): Promise<{ room: Room; selfPeerId: string }> {
  const result = await createBleRoom(device, selfPeerId);
  return { room: result.room as Room, selfPeerId: result.selfPeerId };
}

/**
 * BLE game: get the stored BLE room for this gameId.
 * Returns non-null only when the game was started from BLE lobby (storeBleGameRoom was called on accept).
 */
export function getGameRoomBle(gameId: string): { room: Room; selfPeerId: string } | null {
  const stored = getStoredBleGameRoom(gameId);
  if (!stored) return null;
  return { room: stored.room as Room, selfPeerId: stored.selfPeerId };
}

/**
 * Store the BLE room and selfPeerId for a game so the game page can reuse the connection.
 * Call this when navigating from BLE lobby to game after the peer accepts the challenge.
 */
export function storeBleGameRoom(room: Room, gameId: string, selfPeerId: string): void {
  setStoredBleGameRoom(room as import("./ble-transport").BleRoom, gameId, selfPeerId);
}

/** Retry an async function with exponential backoff (e.g. for NAT traversal). */
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

/**
 * Build a shareable lobby URL with room and ELO hash (for copy-link in lobby).
 * Returns empty string when run outside the browser.
 */
export function getShareableLink(roomId: string, elo: number): string {
  if (typeof window === "undefined") return "";
  const base = window.location.origin + window.location.pathname;
  return `${base}/lobby?room=${encodeURIComponent(roomId)}#elo=${elo}`;
}
