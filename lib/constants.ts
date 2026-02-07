// Primary + 5 WebSocket fallbacks (WebTorrent-compatible)
export const P2P_TRACKERS = [
  "wss://tracker.webtorrent.dev",
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.btorrent.xyz",
  "wss://tracker.fastcast.nz",
  "wss://tracker.webtorrent.io",
] as const;

export const P2P_APP_ID = "p2p-chess-v1";
export const LOBBY_ROOM = "p2p-chess-global";
export const DEFAULT_ELO = 1200;
export const ELO_RANGE = 200;
export const HEARTBEAT_INTERVAL_MS = 10000;
export const MAX_PEERS_DISPLAYED = 10;
export const NAT_RETRY_COUNT = 3;
export const GAME_TIME_MS = 5 * 60 * 1000; // 5 min
export const MOVE_INCREMENT_MS = 30 * 1000; // 30s
