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

export const P2P_TRACKERS = (envTrackers.length > 0 ? envTrackers : [...DEFAULT_P2P_TRACKERS]) as unknown as readonly [string, ...string[]];

/** Optional STUN/TURN for NAT traversal. Set NEXT_PUBLIC_STUN_URL and optionally NEXT_PUBLIC_TURN_URL, NEXT_PUBLIC_TURN_USERNAME, NEXT_PUBLIC_TURN_CREDENTIAL. */
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
  if (servers.length === 0) return []; // use browser/Trystero defaults
  return servers;
}

export const P2P_APP_ID = "p2p-chess-v1";
export const LOBBY_ROOM = "p2p-chess-global";
export const DEFAULT_ELO = 1200;
export const ELO_RANGE = 200;
export const HEARTBEAT_INTERVAL_MS = 10000;
export const MAX_PEERS_DISPLAYED = 100;
export const NAT_RETRY_COUNT = 3;
export const GAME_TIME_MS = 5 * 60 * 1000; // 5 min
export const MOVE_INCREMENT_MS = 30 * 1000; // 30s
