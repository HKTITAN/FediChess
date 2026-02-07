# FediChess

**Decentralized peer-to-peer chess in the browser — the fediverse of chess.** Play with anyone over the web without a central game server, or build your own client using the [open wire protocol](documentation/protocol.md). Matchmaking uses public WebTorrent trackers; moves and chat go directly between peers over WebRTC.

---

## Table of contents

- [Why FediChess?](#why-fedichess)
- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & quick start](#installation--quick-start)
- [Configuration](#configuration)
- [Playing and testing](#playing-and-testing)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Building other clients](#building-other-clients)
- [Ranking and federation](#ranking-and-federation)
- [Contributing](#contributing)
- [License](#license)

---

## Why FediChess?

- **No central server.** Games run between browsers. No company owns your games or ELO; everything can stay on your device.
- **Open protocol.** The [wire protocol](documentation/protocol.md) is documented so anyone can build a compatible client (web, mobile, CLI) and play with this app and others.
- **Self-hostable and federated.** Use default public trackers or run your own. Point your instance at community trackers to grow the pool. Optional [ranking API](documentation/ranking-api.md) allows voluntary, user-consent leaderboards.
- **Censorship-resistant.** As long as peers can reach trackers and each other (or a TURN server), games work. No single point of control.

---

## Features

### Gameplay

- **P2P multiplayer** — No game server. Peers discover each other via WebTorrent trackers and connect over WebRTC. Moves and chat go directly between players.
- **Lobby + ELO matchmaking** — Default ELO range ±200; optional “Show all peers” to challenge anyone in the lobby. Set a username (e.g. `HKTITAN`) visible to others.
- **Full game flow** — 5 min + 30s increment clocks, in-game chat, resign, draw offer/accept. Spectators can join and watch; only the two players send moves.
- **PGN export & analysis** — Copy FEN/PGN from the result dialog. One-click link to analyze on Lichess (or paste into Chess.com).

### Technical

- **Open wire protocol** — [Protocol spec](documentation/protocol.md): rooms, action types (≤12 bytes), JSON payloads. Any client that implements it can interoperate.
- **Self-hosted trackers** — Override `NEXT_PUBLIC_P2P_TRACKERS` to use your own or community WebTorrent trackers. Same protocol across instances.
- **Optional STUN/TURN** — Configure NAT traversal so connections work behind strict firewalls or symmetric NAT (see [Configuration](#configuration)).
- **Static export** — Next.js builds to static files (`out/`). No Node server required in production; host on Vercel, Netlify, or any static host.

### UX

- **Classic and Neon themes** — Toggle board/UI themes. Mobile-responsive layout.
- **Local AI** — Play vs a simple built-in engine (random legal moves) from the home page. For strong engine play, you can integrate e.g. Stockfish.wasm in a Web Worker.

---

## How it works

1. **Discovery** — Your browser connects to one or more WebTorrent-compatible WSS trackers and joins a lobby room (e.g. `p2p-chess-global`) with a shared app ID (`p2p-chess-v1`).
2. **Lobby** — The app sends periodic heartbeats (ELO, username) and receives others’ heartbeats. You see a list of peers; you can challenge one (and choose your color). They accept or decline.
3. **Game room** — On accept, both clients join a game room `p2p-chess-{gameId}` over the same P2P layer. Each move and game event is broadcast as a shared event log; board state is derived by replaying the log so spectators and late joiners see the same position.
4. **WebRTC** — After discovery, peers connect directly (or via TURN if configured). All game data (moves, chat, sync) flows over WebRTC data channels — no server in the middle.

See [Architecture](documentation/architecture.md) for data flow, state, and security notes.

---

## Tech stack

| Layer        | Technology | Notes |
|-------------|------------|--------|
| **UI**      | Next.js 15, React 19, TailwindCSS | App Router, static export. |
| **P2P**     | Trystero (torrent strategy), WebTorrent trackers, WebRTC | Discovery + signaling via trackers; data over WebRTC. |
| **Game**    | chess.js, react-chessboard | Rules, FEN, move validation; board component. |
| **State**   | Zustand | User, lobby, game, UI state in a single store. |
| **Persistence** | IndexedDB (idb-keyval) | ELO, peak ELO, game history. Optional localStorage for name and preferences. |

- **Package name:** `chess-p2p` (npm/repo). **Product name:** FediChess.

---

## Prerequisites

- **Node.js** 18+ (or 20+ recommended)
- **npm** or **pnpm**
- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)

---

## Installation & quick start

### Clone and install

```bash
git clone https://github.com/HKTITAN/fedichess.git
cd fedichess
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Play Random** to join the lobby, or **Copy Link** to share the lobby URL with a friend.

### Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server (default port 3000). |
| `npm run build` | Production build; outputs static export to `out/`. |
| `npm run start` | Serve the built app (after `npm run build`). |
| `npm run lint` | Run ESLint. |

---

## Configuration

All configuration is via environment variables. For Next.js, use `NEXT_PUBLIC_*` for values needed in the browser.

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_P2P_TRACKERS` | Comma-separated WSS tracker URLs. Override to use your own or extra trackers. | `wss://tracker.webtorrent.dev`, `wss://tracker.openwebtorrent.com`, `wss://tracker.btorrent.xyz` |
| `NEXT_PUBLIC_STUN_URL` | STUN server for NAT traversal (e.g. `stun:stun.l.google.com:19302`). | (browser default) |
| `NEXT_PUBLIC_TURN_URL` | TURN server URL (optional). | — |
| `NEXT_PUBLIC_TURN_USERNAME` | TURN username (if required). | — |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | TURN credential (if required). | — |

Create a `.env.local` in the project root (do not commit secrets). Example:

```bash
# Optional: use your own trackers
NEXT_PUBLIC_P2P_TRACKERS=wss://your-tracker.example.com,wss://another.example.com

# Optional: STUN/TURN for strict NATs
NEXT_PUBLIC_STUN_URL=stun:stun.l.google.com:19302
# NEXT_PUBLIC_TURN_URL=turn:turn.example.com:3478
# NEXT_PUBLIC_TURN_USERNAME=user
# NEXT_PUBLIC_TURN_CREDENTIAL=pass
```

---

## Playing and testing

### Two tabs (same machine)

1. **Tab 1:** Open the app, click **Play Random** (or go to `/lobby`).
2. **Tab 2:** Open the app, click **Play Random**.
3. Both join the same lobby. Optionally set usernames. From Tab 1, click **Challenge** next to Tab 2’s peer.
4. In Tab 2, click **Accept**. Both tabs navigate to the game; play as usual.

### Share link (two devices or friends)

1. In the lobby, click **Copy Link** and send the URL (e.g. via chat or email).
2. The other person opens the link in their browser and joins the same lobby.
3. Challenge and accept as above.

### Local AI

Click **Local AI** on the home page to play vs a simple engine (random legal moves). No P2P involved.

---

## Deployment

FediChess builds to a **static export** (`out/`). No Node server is required in production.

### Vercel (recommended)

1. Push the repo to GitHub.
2. In [Vercel](https://vercel.com), import the repository.
3. Deploy. The default Next.js preset works; build command `next build` produces the static export.
4. (Optional) Add environment variables under Project Settings → Environment Variables (e.g. `NEXT_PUBLIC_P2P_TRACKERS`).

### Other hosts

- Run `npm run build` and upload the contents of the `out/` directory to any static host (Netlify, Cloudflare Pages, GitHub Pages, etc.).
- Ensure the host supports client-side routing (SPA fallback to `index.html` for `/lobby`, `/game`, etc.) if you use paths other than `/`.

---

## Project structure

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router: `page.tsx` (home), `lobby/page.tsx`, `game/page.tsx`, `local/page.tsx`, `layout.tsx`, `globals.css`. |
| `components/` | React components: `game/` (board, chat, timer, move history), `landing/hero.tsx`, `ui/` (button, card, dialog, input), `theme-provider.tsx`. |
| `lib/` | Core logic: `chess-engine.ts` (rules, FEN), `p2p.ts` (Trystero, rooms, actions), `store.ts` (Zustand state), `elo.ts`, `pgn.ts`, `constants.ts`. |
| `documentation/` | Architecture, protocol, SDK guide, ranking API, and [documentation index](documentation/README.md). |
| `public/` | Static assets and `manifest.webmanifest`. |

Full “where to find what” map: [documentation/README.md](documentation/README.md).

---

## Documentation

| Document | Description |
|----------|-------------|
| [documentation/README.md](documentation/README.md) | **Index** — quick links and map of the codebase. |
| [Architecture](documentation/architecture.md) | High-level design, data flow (lobby, game, state), discovery/NAT (STUN/TURN), security, comparison with Chess.com/Lichess. |
| [Protocol](documentation/protocol.md) | **Wire protocol** — rooms, action types (≤12 bytes), JSON payloads, lobby and game flows. Required for building other clients. |
| [SDK guide](documentation/sdk-guide.md) | How to build FediChess clients in other languages (JS/TS, Python, Go, Rust) and interoperate with this app. |
| [Ranking API](documentation/ranking-api.md) | Optional voluntary ranking service: submit results, leaderboard. User consent and configurable. |
| [CHANGELOG](CHANGELOG.md) | Version history and release notes. |

---

## Building other clients

The [wire protocol](documentation/protocol.md) is the source of truth. Any client that implements the same rooms, app ID, action names, and JSON payloads can discover peers, send challenges, and play games with this web app and other compatible clients.

- **JavaScript/TypeScript:** This repo is the reference. Use Trystero (torrent strategy), same trackers and app ID, and the action names/payloads from the protocol doc. See [SDK guide](documentation/sdk-guide.md).
- **Other languages:** Use a WebRTC + WebTorrent library in your language, or a small Node/JS bridge that joins rooms and forwards protocol messages. Protocol and payload shapes are in [protocol.md](documentation/protocol.md).

Community clients that implement the protocol can be listed in this README (open an issue or PR).

---

## Ranking and federation

- **Local ELO** — Computed and stored on device; updated after each game. No server required.
- **Voluntary ranking** — The optional [ranking API](documentation/ranking-api.md) lets clients submit game results (with user consent) to a central or federated service for a global leaderboard. Anyone can run a compatible ranking server.
- **Federation** — Using the same protocol and trackers across instances, communities can share a player pool; optional ranking services can aggregate across instances.

---

## Contributing

Contributions are welcome: bug reports, feature ideas, code, and documentation.

- **Issues:** Open a [GitHub Issue](https://github.com/HKTITAN/fedichess/issues) to report bugs or suggest features.
- **Pull requests:** Open a PR with your changes. Keep PRs focused; run `npm run lint` before submitting.
- **Documentation:** Improvements to [documentation/](documentation/) and this README are welcome.
- **Protocol:** The [protocol](documentation/protocol.md) is the source of truth. Client implementations in other languages that follow it can be proposed for listing as community SDKs.

See [CONTRIBUTING.md](CONTRIBUTING.md) for a short guide. By contributing, you agree that your contributions will be licensed under the MIT License.

---

## License

MIT. See [LICENSE](LICENSE).
