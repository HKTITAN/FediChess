# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

- (No changes yet.)

---

## [0.3.0] - 2026-02-07

### Added

- **Dual transport (WebRTC + BLE):** Same wire protocol over two transports. Play online via WebRTC (Trystero/trackers) or **nearby via BLE** (Web Bluetooth, no internet).
- **BLE transport:** `lib/ble-transport.ts` — FediChess GATT service, 1:1 connection, length-prefixed messages. Lobby: "Connect via BLE"; game reuses the same connection; stored room for lobby→game navigation.
- **Transport abstraction:** `lib/transport-types.ts` — shared `Room` interface; Trystero and BLE both implement it so lobby/game code is transport-agnostic.
- **Lobby BLE flow:** Connect via BLE → heartbeat exchange → peer appears with "Nearby" badge; challenge/accept over BLE; on accept, store BLE room and navigate to game with `transport=ble`.
- **Game transport-aware:** Game page reads `transport=ble` from URL; uses stored BLE room and session `selfPeerId`; all actions (move, chat, sync, history) work over BLE or WebRTC.
- **Stability and edge cases:** BLE disconnect clears heartbeat timer, ref, and pending BLE challenge; game `onPeerLeave` clears stored BLE room and ref; accept/decline guarded when BLE connection lost; "Disconnect" in lobby to leave BLE cleanly; `clearStoredBleGameRoom()` safe to call multiple times.
- **Protocol doc:** BLE transport section (service/characteristic UUIDs, message format, 1:1 scope). Same action names and JSON payloads on both transports.
- **Web Bluetooth types:** `types/web-bluetooth.d.ts` for TypeScript; `tsconfig` includes `types/**/*.d.ts`.
- **Store:** Peer list extended with optional `transport: 'webrtc' | 'ble'` for UI and challenge routing.

### Changed

- Lobby: BLE connected state, Disconnect button, clear BLE on unmount via shared `clearBleLobby()`.
- Game: Room and `selfId` stored in `gameRoomRef`; callbacks use ref so BLE and WebRTC paths share the same logic; cleanup calls `clearStoredBleGameRoom()` for BLE games.

### Fixed

- BLE disconnect in lobby no longer leaves stale timer or ref; pending BLE challenge cleared when peer leaves.
- Accept/decline with lost BLE connection no longer falls back to WebRTC (challenge cleared with message).

---

## [0.2.0] - 2026-02-07

### Added

- Trystero action name fix: `challengeResponse` → `challResp` (12-byte limit).
- Challenger redirect: include `room` in game URL when challenger receives accept.
- Working WebTorrent trackers only; optional `NEXT_PUBLIC_P2P_TRACKERS` env override.
- Lobby: "Show all peers" toggle; usernames (e.g. HKTITAN) with "Playing as" display.
- PGN export and "Analyze on Lichess" in game result dialog.
- Documentation: protocol, architecture, SDK guide, ranking API.
- STUN/TURN support via env for NAT traversal.
- CONTRIBUTING.md, LICENSE (MIT).
- **Deployment and cross-device:** Explicit viewport (device-width, initialScale); manifest icons (favicon fallback); root error boundary with fallback UI; inline theme script in `<head>` to prevent flash; responsive board width (ResizeObserver, 280–400px); 44px min touch targets and safe-area padding; local AI label and hydration-safe local page; stable chat message keys; dialog focus/restore and aria-modal; ESLint config for `next lint`; README PWA icons note.

### Changed

- README: fediverse positioning, docs links, features list.
- Tracker list: removed failing trackers; default to three working WSS trackers.

---

## [0.1.0] - 2026-01-01

### Added

- Initial release: P2P multiplayer chess over WebRTC (Trystero/torrent).
- Lobby with ELO matchmaking, challenge/accept flow.
- Game: moves, chat, resign, draw offer/accept, timers, FEN sync.
- Local AI (random moves), themes, IndexedDB ELO persistence.
