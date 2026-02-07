# FediChess documentation index

Quick links and where to find what in the codebase.

## Docs

| Doc | Summary |
|-----|---------|
| [architecture.md](architecture.md) | High-level design, **transports** (WebRTC + BLE), Room interface, diagrams, data flow, stack, discovery/NAT, **stability** (disconnect, refresh). |
| [protocol.md](protocol.md) | Wire protocol: rooms, action types, payloads, lobby and game flows; **two transports** (WebRTC, BLE) with same actions. |
| [sdk-guide.md](sdk-guide.md) | How to build FediChess clients in other languages (JS/TS, Python, Go, Rust). |
| [ranking-api.md](ranking-api.md) | Optional voluntary ranking service spec (submit results, leaderboard). |

## Where to find what

| Concern | Location |
|---------|----------|
| Game logic (rules, FEN, moves) | `lib/chess-engine.ts` |
| P2P connection, rooms, actions (WebRTC) | `lib/p2p.ts` |
| BLE transport (Web Bluetooth, 1:1) | `lib/ble-transport.ts` |
| Transport abstraction (Room interface) | `lib/transport-types.ts` |
| Web Bluetooth API types | `types/web-bluetooth.d.ts` |
| State (user, lobby, game, UI) | `lib/store.ts` |
| ELO math | `lib/elo.ts` |
| PGN export | `lib/pgn.ts` |
| Constants (rooms, app id) | `lib/constants.ts` |
| Routes | `app/page.tsx`, `app/lobby/page.tsx`, `app/game/page.tsx`, `app/local/page.tsx` |
| Game UI (board, chat, timer, history) | `components/game/` |
| Landing | `components/landing/hero.tsx` |
| Shared UI | `components/ui/` |
