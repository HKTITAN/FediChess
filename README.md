# FediChess

[![GitHub](https://img.shields.io/badge/GitHub-FediChess-24292f?style=flat&logo=github)](https://github.com/HKTITAN/FediChess) [![version](https://img.shields.io/badge/version-0.3.0-blue)](https://github.com/HKTITAN/FediChess/releases)

**Decentralized peer-to-peer chess in the browser — the fediverse of chess.** Play with anyone over the web without a central game server, or **nearby over BLE** with no internet. Same [open wire protocol](documentation/protocol.md) over **WebRTC** (online) and **BLE** (local); build your own client and interoperate. Matchmaking uses public WebTorrent trackers for online play; moves and chat go directly between peers.

**Version:** 0.3.0 — see [CHANGELOG](CHANGELOG.md) for release history.

### Deploy

| | | |
|:---:|:---:|:---:|
| [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/HKTITAN/fedichess) | [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/HKTITAN/fedichess) | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/HKTITAN/fedichess) |
| [![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?repository=https://github.com/HKTITAN/fedichess) | [![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?type=git&builder=buildpack&repository=github.com/HKTITAN/fedichess&branch=main&name=fedichess) | [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/HKTITAN/fedichess) |
| [![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/HKTITAN/fedichess/tree/main) | [![Cloudflare Pages](https://img.shields.io/badge/Deploy_to-Cloudflare_Pages-f38020?style=for-the-badge&logo=cloudflare)](https://dash.cloudflare.com/?to=/:account/pages/new/connect-repo?repo=https://github.com/HKTITAN/fedichess) | [![Azure Static Web Apps](https://img.shields.io/badge/Deploy_to-Azure_Static_Web_Apps-0078d4?style=for-the-badge&logo=microsoftazure)](https://portal.azure.com/#create/Microsoft.StaticApp) |
| [![Firebase Hosting](https://img.shields.io/badge/Deploy_to-Firebase_Hosting-ffca28?style=for-the-badge&logo=firebase)](https://console.firebase.google.com/project/_/hosting) | [![AWS Amplify](https://img.shields.io/badge/Deploy_to-AWS_Amplify-ff9900?style=for-the-badge&logo=awsamplify)](https://console.aws.amazon.com/amplify/home#/create&repo=https://github.com/HKTITAN/fedichess) | [![Fly.io](https://img.shields.io/badge/Deploy_to-Fly.io-4051b5?style=for-the-badge&logo=fly.io)](https://fly.io/docs/hands-on/install-flyctl/) |
| [![Google Cloud Run](https://img.shields.io/badge/Deploy_to-Google_Cloud_Run-4285f4?style=for-the-badge&logo=googlecloud)](https://console.cloud.google.com/run) | [![Deno Deploy](https://img.shields.io/badge/Deploy_to-Deno_Deploy-000?style=for-the-badge&logo=deno)](https://deno.com/deploy) | [![Platform.sh](https://img.shields.io/badge/Deploy_to-Platform.sh-1a1a2e?style=for-the-badge)](https://console.platform.sh/) |

### Open in / Build with

| | | |
|:---:|:---:|:---:|
| [![Open in Cursor](https://img.shields.io/badge/Open_in-Cursor-000?style=for-the-badge&logo=cursor)](https://cursor.com/open?repo=https://github.com/HKTITAN/fedichess) | [![GitHub Codespaces](https://img.shields.io/badge/Open_in-GitHub_Codespaces-24292f?style=for-the-badge&logo=github)](https://codespaces.new/HKTITAN/fedichess) | [![Open in GitPod](https://img.shields.io/badge/Open_in-GitPod-ffae33?style=for-the-badge&logo=gitpod)](https://gitpod.io/#https://github.com/HKTITAN/fedichess) |
| [![Open in CodeSandbox](https://img.shields.io/badge/Open_in-CodeSandbox-151515?style=for-the-badge&logo=codesandbox)](https://githubbox.com/HKTITAN/fedichess) | [![Open in StackBlitz](https://img.shields.io/badge/Open_in-StackBlitz-1389fd?style=for-the-badge&logo=stackblitz)](https://stackblitz.com/github/HKTITAN/fedichess) | [![Open in Replit](https://img.shields.io/badge/Open_in-Replit-667881?style=for-the-badge&logo=replit)](https://replit.com/github/HKTITAN/fedichess) |
| [![Open in Glitch](https://img.shields.io/badge/Open_in-Glitch-3333ff?style=for-the-badge&logo=glitch)](https://glitch.com/import/github/HKTITAN/fedichess) | [![GitHub Copilot](https://img.shields.io/badge/Build_with-GitHub_Copilot-24292f?style=for-the-badge&logo=github)](https://github.com/HKTITAN/fedichess) | [![v0](https://img.shields.io/badge/Build_with-v0-000?style=for-the-badge&logo=vercel)](https://v0.dev) |
| [![Codeium](https://img.shields.io/badge/Build_with-Codeium-000?style=for-the-badge&logo=codeium)](https://codeium.com) | [![Windsurf](https://img.shields.io/badge/Build_with-Windsurf-000?style=for-the-badge)](https://codeium.com/windsurf) | [![Bolt.new](https://img.shields.io/badge/Build_with-Bolt.new-000?style=for-the-badge)](https://bolt.new) |
| [![VS Code](https://img.shields.io/badge/Open_in-VS_Code-007acc?style=for-the-badge&logo=visualstudiocode)](https://github.dev/HKTITAN/fedichess) | [![Codeium IDE](https://img.shields.io/badge/Codeium_IDE-000?style=for-the-badge&logo=codeium)](https://codeium.com/ide) | [![Cursor Rules](https://img.shields.io/badge/Cursor_Rules-000?style=for-the-badge&logo=cursor)](https://cursor.com) |

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
- [Deployment checks (CI)](#deployment-checks-ci)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Architecture at a glance](#architecture-at-a-glance)
- [Security and privacy](#security-and-privacy)
- [FAQ](#faq)
- [About this repository](#about-this-repository)
- [Transports](#transports)
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
- **Account backup** — Export progress (ELO, game history, name) to a file and restore on another device. Backups are signed (password-protected HMAC) so they cannot be edited for fair play. Use **Backup account** from the lobby or home.

### Technical

- **Open wire protocol** — [Protocol spec](documentation/protocol.md): rooms, action types (≤12 bytes), JSON payloads. Any client that implements it can interoperate.
- **Self-hosted trackers** — Override `NEXT_PUBLIC_P2P_TRACKERS` to use your own or community WebTorrent trackers. Same protocol across instances.
- **Optional STUN/TURN** — Configure NAT traversal so connections work behind strict firewalls or symmetric NAT (see [Configuration](#configuration)).
- **Static export** — Next.js builds to static files (`out/`). No Node server required in production; host on Vercel, Netlify, or any static host.

### UX

- **Classic and Neon themes** — Toggle board/UI themes. Mobile-responsive layout, 44px touch targets, safe-area padding.
- **Local AI** — Play vs a simple built-in engine (random legal moves) from the home page. For strong engine play, you can integrate e.g. Stockfish.wasm in a Web Worker.

---

## How it works

1. **Discovery** — Your browser connects to one or more WebTorrent-compatible WSS trackers and joins a lobby room (e.g. `p2p-chess-global`) with a shared app ID (`p2p-chess-v1`).
2. **Lobby** — The app sends periodic heartbeats (ELO, username) and receives others’ heartbeats. You see a list of peers; you can challenge one (and choose your color). They accept or decline.
3. **Game room** — On accept, both clients join a game room `p2p-chess-{gameId}` over the same P2P layer. Each move and game event is broadcast as a shared event log; board state is derived by replaying the log so spectators and late joiners see the same position.
4. **WebRTC** — After discovery, peers connect directly (or via TURN if configured). All game data (moves, chat, sync) flows over WebRTC data channels — no server in the middle.

**Dual transport:** The same protocol also runs over **BLE** (Web Bluetooth) for nearby play — see [Transports](#transports) and [Protocol (BLE)](documentation/protocol.md#2-ble-web-bluetooth). [Architecture](documentation/architecture.md) has diagrams, data flow, and stability (disconnect, refresh).

---

## Tech stack

| Layer        | Technology | Notes |
|-------------|------------|--------|
| **UI**      | Next.js 15, React 19, TailwindCSS | App Router, static export; responsive, touch-friendly. |
| **P2P**     | Trystero (torrent), WebTorrent trackers, WebRTC; **BLE** (Web Bluetooth) | **Online:** discovery/signaling via trackers, data over WebRTC. **Nearby:** BLE GATT (see `lib/ble-transport.ts`). Shared `Room` interface in `lib/transport-types.ts`. |
| **Game**    | chess.js, react-chessboard | Rules, FEN, move validation; board component. |
| **State**   | Zustand | User, lobby, game, UI state; peers tagged by transport (webrtc/ble). |
| **Persistence** | IndexedDB (idb-keyval) | ELO, peak ELO, game history. Optional localStorage for name and preferences. |

- **Package name:** `fedichess` (npm/repo). **Product name:** FediChess. **Version:** 0.3.0.

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

### Nearby (BLE)

1. **Lobby:** Click **Connect via BLE** (Chrome or Edge; HTTPS or localhost). Select a FediChess BLE device when the picker appears.
2. The other device appears as a **Nearby** peer. Challenge and accept as usual; the game runs over the same BLE connection.
3. **Note:** The browser can only act as a **central** (client). The other side must advertise the FediChess GATT service (e.g. a native app or a separate BLE peripheral). Two browser tabs cannot connect to each other via BLE alone.

### Local AI

Click **Local AI** on the home page to play vs a simple engine (random legal moves). No P2P involved.

---

## Deployment

FediChess builds to a **static export** (`out/`). No Node server is required in production.

### Build configuration (Vercel, Netlify, Render, etc.)

The repo is set up for one-click and Git-based deploys:

| File | Purpose |
|------|---------|
| `package.json` | `engines.node`: `>=18.17.0`; scripts: `build` = `next build`, `dev` = `next dev`. |
| `.nvmrc` | Node 20 (used by many platforms and locally with `nvm use`). |
| `vercel.json` | Framework: `nextjs` (Vercel runs `next build` and serves the static export). |
| `netlify.toml` | Build: `npm run build`, publish: `out`, `NODE_VERSION`: 20. |
| `render.yaml` | Blueprint: static site, `buildCommand`: `npm ci && npm run build`, `staticPublishPath`: `out`. |

Other hosts: use build command `npm run build` (or `npm ci && npm run build`) and publish directory `out`. Optional env: `NEXT_PUBLIC_P2P_TRACKERS`, `NEXT_PUBLIC_STUN_URL`, etc. (see [Configuration](#configuration)).

### Vercel (recommended)

1. Push the repo to GitHub.
2. In [Vercel](https://vercel.com), import the repository.
3. Deploy. The default Next.js preset works; build command `next build` produces the static export.
4. (Optional) Add environment variables under Project Settings → Environment Variables (e.g. `NEXT_PUBLIC_P2P_TRACKERS`).

### Other hosts

- Run `npm run build` and upload the contents of the `out/` directory to any static host (Netlify, Cloudflare Pages, GitHub Pages, etc.).
- Ensure the host supports client-side routing (SPA fallback to `index.html` for `/lobby`, `/game`, etc.) if you use paths other than `/`.

### PWA icons

The manifest uses the favicon as a fallback. For a better "Add to home screen" experience, add `icon-192.png` and `icon-512.png` to `public/` and update the `icons` array in `public/manifest.webmanifest`.

### Deployment checks (CI)

The repo runs **GitHub Actions CI** (lint + build) on every push and pull request to the default branch. You can require this check to pass before Vercel promotes a deployment to Production, so only passing builds go live.

- **Workflow:** [.github/workflows/ci.yml](.github/workflows/ci.yml) — installs dependencies, runs `npm run lint`, then `npm run build`.
- **Enable in Vercel:** Project → **Settings** → **Git** → **Deployment Checks** → require the **CI** (or "Build and lint") check before deploying. See [documentation/deployment-checks.md](documentation/deployment-checks.md) for step-by-step instructions and troubleshooting.

---

## Project structure

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router: `page.tsx` (home), `lobby/page.tsx`, `game/page.tsx`, `local/page.tsx`, `layout.tsx`, `globals.css`. |
| `components/` | React components: `game/` (board, chat, timer, move history), `landing/hero.tsx`, `ui/` (button, card, dialog, input), `theme-provider.tsx`, `error-boundary.tsx`. |
| `lib/` | Core logic: `chess-engine.ts` (rules, FEN), `p2p.ts` (Trystero + BLE helpers), `ble-transport.ts` (BLE GATT room), `transport-types.ts` (Room interface), `store.ts`, `elo.ts`, `pgn.ts`, `constants.ts`, `clipboard.ts`. |
| `types/` | TypeScript: `web-bluetooth.d.ts` (Web Bluetooth API for BLE). |
| `documentation/` | [Index](documentation/README.md), architecture, protocol, SDK guide, ranking API. |
| `public/` | Static assets and `manifest.webmanifest`. |

Full “where to find what” map: [documentation/README.md](documentation/README.md).

---

## Documentation

| Document | Description |
|----------|-------------|
| [documentation/README.md](documentation/README.md) | **Index** — quick links and map of the codebase. |
| [Architecture](documentation/architecture.md) | High-level design, **transports (WebRTC + BLE)**, diagrams, data flow, state, discovery/NAT, stability (disconnect, refresh), security. |
| [Protocol](documentation/protocol.md) | **Wire protocol** — transports (WebRTC, BLE), rooms, action types (≤12 bytes), JSON payloads, lobby and game flows. Required for building other clients. |
| [SDK guide](documentation/sdk-guide.md) | How to build FediChess clients in other languages (JS/TS, Python, Go, Rust) and interoperate with this app. |
| [Ranking API](documentation/ranking-api.md) | Optional voluntary ranking service: submit results, leaderboard. User consent and configurable. |
| [CHANGELOG](CHANGELOG.md) | Version history and release notes (current: 0.3.0). |
| [Releases](documentation/releases.md) | How to cut a release; tag-triggered GitHub Releases with notes from CHANGELOG. |
| [Deployment checks](documentation/deployment-checks.md) | Require CI to pass before production deploys (Vercel). |

All of the above live in the [documentation/](documentation/) folder; [documentation/README.md](documentation/README.md) is the index.

---

## Architecture at a glance

FediChess has **no central game server**. All gameplay (moves, chat, sync) happens directly between peers. The app uses two **transports** that share the same **wire protocol** (rooms, action names, JSON payloads):

1. **WebRTC (online)** — Browsers connect to public WebTorrent-compatible WSS trackers to discover each other, then form peer-to-peer WebRTC data channels. The trackers are used only for discovery and signaling; once connected, game data flows only between the two players (and any spectators). Lobby room: `p2p-chess-global`; each game gets a room `p2p-chess-{gameId}`.
2. **BLE (nearby)** — For local play without internet, the same protocol runs over Web Bluetooth (GATT). One device acts as a peripheral advertising the FediChess GATT service; the browser connects as central. Messages are length-prefixed `actionName` + JSON, same payloads as WebRTC.

Lobby and game UI are **transport-agnostic**: they use a single **Room** interface (`makeAction`, `getPeers`, `onPeerJoin`, `onPeerLeave`, `leave`) implemented by both Trystero (WebRTC) and the BLE layer. State (user, lobby, game) lives in Zustand; persistence (ELO, game history) is IndexedDB and optional account backup (HMAC-signed export). For full diagrams, data flow, and edge cases (disconnect, refresh, NAT), see [Architecture](documentation/architecture.md).

---

## Transports

| Transport | Discovery | Data | Scope | Use case |
|-----------|-----------|------|--------|----------|
| **WebRTC** | WebTorrent trackers (WSS), Trystero | WebRTC data channels | Many peers per room; lobby + game rooms | Online play, spectators |
| **BLE** | Web Bluetooth device picker (FediChess GATT service) | GATT characteristic (length-prefixed `actionName` + JSON) | 1:1 per connection | Nearby play, no internet |

Same [protocol](documentation/protocol.md): rooms, action names, JSON payloads. Only the wire and discovery differ. Peers discovered over WebRTC are challenged over WebRTC; peers discovered over BLE are challenged over BLE. The game page uses the same Room interface for both.

---

## Security and privacy

- **No server-side game logic.** Moves and chat are sent peer-to-peer. We do not log or store game content. ELO and game history are stored only in your browser (IndexedDB) and, if you use it, in your own backup file.
- **Identity.** There is no account system. You choose a display name (e.g. a username); it is not verified. Anyone who can join the same lobby room can see that name and your ELO (from heartbeats). For strong authentication you would need a separate mechanism (e.g. signed credentials) not provided by this app.
- **Trust.** Peers can send arbitrary JSON. The app validates FEN and game events and ignores invalid data. Only the two players designated via `role` messages may send moves and game events; spectators cannot.
- **Trackers.** Default trackers are public WebTorrent WSS servers. They see room IDs and peer presence (for signaling); they do not see move or chat content. To reduce exposure you can run your own tracker and set `NEXT_PUBLIC_P2P_TRACKERS`.
- **Account backup.** Exports are signed with HMAC (key derived from your password) so tampering is detectable. Backups are intended for personal restore; do not share backup files if they contain data you care about.

---

## Building other clients

The [wire protocol](documentation/protocol.md) is the source of truth. Any client that implements the same rooms, app ID, action names, and JSON payloads can discover peers, send challenges, and play games with this web app and other compatible clients.

- **JavaScript/TypeScript:** This repo is the reference. **WebRTC:** Use Trystero (torrent strategy), same trackers and app ID. **BLE:** Implement the FediChess GATT service (see protocol doc for UUIDs and message format) or use `lib/ble-transport.ts` as reference. See [SDK guide](documentation/sdk-guide.md).
- **Python, Rust, C++:** Official SDKs and examples live in [sdks/](sdks/); they use a shared Node bridge and the same protocol.
- **Other languages:** Use the [bridge](sdks/bridge/README.md) from a client (see [sdks/](sdks/)) or a WebRTC + WebTorrent library; protocol and payload shapes are in [protocol.md](documentation/protocol.md).

Community clients that implement the protocol can be listed in this README (open an issue or PR).

---

## FAQ

**Do I need an account?**  
No. You set a display name in the app; it is stored locally and sent in lobby heartbeats. There is no login or password for the game server (there is no game server). Account backup is optional and password-protected for your own restore.

**Why can’t I see any peers in the lobby?**  
You and others must be in the same lobby room (default: `p2p-chess-global`) and use the same app ID and trackers. If you changed `NEXT_PUBLIC_P2P_TRACKERS`, you’ll only see peers using the same trackers. Firewall or NAT can block WebRTC; try enabling STUN/TURN (see [Configuration](#configuration)).

**Does BLE work between two browsers?**  
No. The browser is always the **central** (client). The other side must be a **peripheral** advertising the FediChess GATT service (e.g. a native app or a BLE board). Two browser tabs cannot connect to each other via BLE.

**Where is my ELO stored?**  
Locally in your browser (IndexedDB). Optional “Backup account” exports it to a file; you can restore on another device. Optional ranking API can submit results to a third-party leaderboard with your consent.

**Can I self-host?**  
Yes. Build with `npm run build` and serve the `out/` directory. You can point the app at your own WebTorrent trackers via `NEXT_PUBLIC_P2P_TRACKERS`. There is no backend to host; it’s a static site.

**How do I add a new SDK (e.g. Go)?**  
Implement a client that spawns the [Node bridge](sdks/bridge/README.md) and speaks the same stdio JSON-lines protocol, or implement WebRTC + tracker discovery in your language. See [sdks/](sdks/) and [SDK guide](documentation/sdk-guide.md).

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

## About this repository

FediChess is **open source** (MIT). This repository contains the web app, wire protocol docs, and official SDKs (Python, Rust, C++) that use a shared Node bridge.

**Suggested GitHub description** (repo About):  
*The fediverse of chess — decentralized P2P chess in the browser. WebRTC and BLE, open protocol, no central server. Play online or nearby.*

**Suggested topics:** `chess`, `p2p`, `webrtc`, `decentralized`, `multiplayer`, `nextjs`, `react`, `open-protocol`, `fediverse`, `typescript`, `ble`, `web-bluetooth`.

---

## License

MIT. See [LICENSE](LICENSE).

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=HKTITAN/FediChess&type=Date)](https://star-history.com/#HKTITAN/FediChess&Date)
