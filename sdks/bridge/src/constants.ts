/**
 * FediChess protocol constants (same as main app).
 * Override trackers via P2P_TRACKERS env (comma-separated).
 */
const DEFAULT_TRACKERS = [
  "wss://tracker.webtorrent.dev",
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.btorrent.xyz",
];

const envTrackers =
  process.env.P2P_TRACKERS?.trim()
    ? process.env.P2P_TRACKERS.split(",").map((u) => u.trim()).filter(Boolean)
    : [];

export const P2P_APP_ID = "p2p-chess-v1";
export const LOBBY_ROOM = "p2p-chess-global";
export const TRACKERS: string[] =
  envTrackers.length > 0 ? envTrackers : [...DEFAULT_TRACKERS];
