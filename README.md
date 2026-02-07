# P2P Chess

Production-ready, pure client-side P2P multiplayer chess. No servers. Matchmaking via WebTorrent DHT, real-time moves over WebRTC.

## Tech Stack

- **Next.js 15** static export
- **chess.js** + **react-chessboard** (logic + UI)
- **Trystero** (WebTorrent adapter for P2P)
- **Zustand** + **IndexedDB** (state + ELO persistence)
- **TailwindCSS** (styling)

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Deploy (Hobby tier supported)

Static export: `next build` produces `out/`.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Test P2P (2 tabs)

1. Tab 1: Open app, click **Play Random**
2. Tab 2: Open app, click **Play Random**
3. Both join lobby; click **Challenge** from Tab 1 to Tab 2
4. Tab 2 clicks **Accept** → both enter game at `/game?room=...&color=...`

## Test with Link Fallback

1. Tab 1: Lobby, click **Copy** on shareable link
2. Tab 2: Paste link in address bar
3. Both in same lobby; challenge as above

## Local AI

Click **Local AI** on landing. Plays vs a simple engine (random legal moves). For Stockfish-level AI, integrate stockfish.wasm via CDN + Web Worker.

## Features

- ELO matchmaking (±200)
- 5min + 30s increment timer
- Chat (emotes + text)
- Resign / Draw offer
- FEN replay share
- Classic + Neon themes
- Mobile responsive
