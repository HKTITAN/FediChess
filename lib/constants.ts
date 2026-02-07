/**
 * P2P and app constants: trackers, app id, lobby room, ELO defaults, timers.
 * Override trackers via NEXT_PUBLIC_P2P_TRACKERS; STUN/TURN via NEXT_PUBLIC_STUN_URL etc.
 */

// WebTorrent-compatible WSS trackers (working as of 2026). Override via NEXT_PUBLIC_P2P_TRACKERS (comma-separated) for self-hosted/fediverse.
const DEFAULT_P2P_TRACKERS = [
  "wss://tracker.webtorrent.dev",
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.btorrent.xyz",
] as const;

const envTrackers =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_P2P_TRACKERS?.trim()
    ? process.env.NEXT_PUBLIC_P2P_TRACKERS.split(",").map((u) => u.trim()).filter(Boolean)
    : [];

/** WSS tracker URLs used for WebRTC discovery. Override with NEXT_PUBLIC_P2P_TRACKERS (comma-separated). */
export const P2P_TRACKERS = (envTrackers.length > 0 ? envTrackers : [...DEFAULT_P2P_TRACKERS]) as unknown as readonly [string, ...string[]];

/**
 * ICE servers for NAT traversal (STUN/TURN).
 * Set NEXT_PUBLIC_STUN_URL and optionally NEXT_PUBLIC_TURN_URL, NEXT_PUBLIC_TURN_USERNAME, NEXT_PUBLIC_TURN_CREDENTIAL.
 * Returns empty array to use browser/Trystero defaults when not set.
 */
export function getIceServers(): Array<{ urls: string | string[]; username?: string; credential?: string }> {
  const servers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [];
  const stun = typeof process !== "undefined" && process.env.NEXT_PUBLIC_STUN_URL?.trim();
  if (stun) servers.push({ urls: stun });
  const turn = typeof process !== "undefined" && process.env.NEXT_PUBLIC_TURN_URL?.trim();
  if (turn) {
    servers.push({
      urls: turn,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? undefined,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? undefined,
    });
  }
  if (servers.length === 0) return [];
  return servers;
}

/** App version (keep in sync with package.json). */
export const APP_VERSION = "0.3.0";

/** App ID shared by all FediChess clients (Trystero room namespace). */
export const P2P_APP_ID = "p2p-chess-v1";

/** Default lobby room ID (p2p-chess-global). */
export const LOBBY_ROOM = "p2p-chess-global";

/** Default ELO for new users. */
export const DEFAULT_ELO = 1200;

/** Default ELO range for matchmaking (±). */
export const ELO_RANGE = 200;

/** Interval in ms for sending lobby heartbeats. */
export const HEARTBEAT_INTERVAL_MS = 10000;

/** Max peers to show in lobby list. */
export const MAX_PEERS_DISPLAYED = 100;

/** Number of retries for NAT/connection (withNatRetry). */
export const NAT_RETRY_COUNT = 3;

/** Total game time per player (5 min). */
export const GAME_TIME_MS = 5 * 60 * 1000;

/** Increment per move (30 s). */
export const MOVE_INCREMENT_MS = 30 * 1000;
