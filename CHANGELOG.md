# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Shared versioned game event log (history + historySync) so all players and spectators see the same PGN-like history; late joiners receive full log.
- Spectator mode: join with `spectate=1` to watch a match read-only; only the two players can send moves or game events.
- Security: only designated white/black players can send move/gameEvent; turn validation; broadcast to all peers including spectators.
- Role announcement (`role` action) to establish whitePeerId and blackPeerId in the game room.

### Changed

- Moves and game events are broadcast to all peers in the room (not only the opponent) so spectators receive them.
- Board state can be derived from the event log for consistency across participants.

### Fixed

- N/A

### Security

- Ignore move and gameEvent messages from any peer that is not the designated white or black player.
- Spectators cannot send move/gameEvent; UI disables controls in spectator mode.

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
