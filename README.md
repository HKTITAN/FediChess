# P2P Chess

**Decentralized P2P chess — the fediverse of chess.** Play in the browser or build your own client with the [open protocol](documentation/protocol.md) and SDKs. No central server: matchmaking via WebTorrent trackers, real-time moves over WebRTC.

## Features

- **P2P multiplayer**: No game server; peers discover each other and connect directly.
- **ELO matchmaking** (default ±200) with optional "Show all peers" to challenge anyone in the lobby.
- **Usernames**: Set a friendly username (e.g. HKTITAN) visible to others; play as that identity.
- **5 min + 30s increment** timer, chat, resign, draw offer/accept.
- **PGN export** and **Analyze on Lichess**: Copy FEN/PGN from the result dialog and open games in Lichess (or Chess.com) for analysis.
- **Open wire protocol**: [Protocol spec](documentation/protocol.md) so any client can implement the same messages and interoperate.
- **Self-hostable**: Override trackers via `NEXT_PUBLIC_P2P_TRACKERS` (comma-separated) to run your own or add community trackers.
- Classic + Neon themes, mobile responsive.

## Tech stack

- **Next.js 15** (static export)
- **chess.js** + **react-chessboard** (rules + board)
- **Trystero** (WebTorrent adapter for P2P)
- **Zustand** + **IndexedDB** (state + ELO persistence)
- **TailwindCSS**

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

Optional: set `NEXT_PUBLIC_P2P_TRACKERS` to a comma-separated list of WSS tracker URLs to use your own trackers.

## Deploy (e.g. Vercel)

1. Push to GitHub and import in Vercel (or similar).
2. Deploy; Hobby tier is enough. Static export: `next build` produces `out/`.

## Test P2P (2 tabs)

1. Tab 1: Open app, click **Play Random** (or open `/lobby`).
2. Tab 2: Open app, click **Play Random**.
3. Both join the lobby; set usernames if you like. Click **Challenge** from Tab 1 to Tab 2.
4. Tab 2 clicks **Accept** → both enter the game.

Or share the lobby link from Tab 1; Tab 2 pastes it to join the same room.

## Documentation

- [Architecture](documentation/architecture.md) — high-level design, data flow, Discovery/NAT (STUN/TURN), comparison with Chess.com and Lichess.
- [Protocol](documentation/protocol.md) — wire protocol: rooms, action types, payloads, flows.
- [SDK guide](documentation/sdk-guide.md) — how to build clients in other languages.
- [Ranking API](documentation/ranking-api.md) — optional voluntary ranking service spec for a global leaderboard (submit results and GET leaderboard).
- [Changelog](CHANGELOG.md) — version history and release notes.

## Local AI

Click **Local AI** on the home page for a quick game vs a simple engine (random legal moves). For strong engine play, integrate e.g. stockfish.wasm via a Web Worker.

## Contributing

Contributions are welcome. Open an issue to discuss or a PR with changes. Run `npm run lint` before submitting. This project is open source.

## License

MIT — see [LICENSE](LICENSE).
