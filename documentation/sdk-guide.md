# SDK guide — building clients in any language

This guide explains how to build a P2P Chess client in any language (JavaScript/TypeScript, Python, Go, Rust, etc.) so it can discover peers, send and receive challenges, and play games with the reference web app and other compatible clients.

## Prerequisites

- **Protocol**: Read the [wire protocol](protocol.md). All clients must use the same room IDs, action type names (≤12 bytes), and JSON payload shapes.
- **Transport**: Peers discover each other via WebTorrent-compatible WSS trackers and then connect over WebRTC data channels. Your client needs a way to:
  1. Connect to the same trackers (e.g. `wss://tracker.webtorrent.dev`, `wss://tracker.openwebtorrent.com`, `wss://tracker.btorrent.xyz`) and join the same **app ID** (`p2p-chess-v1`) and **room IDs** (lobby: `p2p-chess-global`, game: `p2p-chess-{gameId}`).
  2. Exchange WebRTC offers/answers (signaling) and open data channels to send/receive JSON messages.

## JavaScript / TypeScript

The reference implementation is the Next.js app in this repo. To build a minimal SDK or another JS client:

- Use **Trystero** with the **torrent** strategy (or another strategy that shares the same room semantics). Join the lobby room, register actions for `heartbeat`, `challenge`, `challResp`; in game room register `move`, `chat`, `gameEvent`, `sync`.
- Use the exact action names and payload shapes from [protocol.md](protocol.md). Action names must be ≤12 bytes (e.g. `challResp` not `challengeResponse`).
- Reuse the same tracker list (or `NEXT_PUBLIC_P2P_TRACKERS` override). Pass the same `appId` and `relayUrls` into Trystero so you join the same logical rooms as the web app.

A future optional step is to extract a small npm package from this app that only does room join + send/receive for each action (no UI), as the official JS/TS SDK.

## Other languages (Python, Go, Rust, etc.)

There is no central server: discovery and signaling go through WebTorrent trackers and WebRTC. Options:

1. **Use a WebRTC + WebTorrent library in your language**  
   If one exists (e.g. for Node or native), implement the same flow: connect to the WSS trackers, join room `p2p-chess-global` with app ID `p2p-chess-v1`, and exchange the same JSON messages. The [protocol](protocol.md) defines all message types and payloads.

2. **Bridge via a small Node/JS process**  
   Run a thin Node script that uses Trystero to join the lobby/game rooms and exposes a local API (e.g. HTTP or stdio). Your Python/Go/Rust app talks to this bridge and the bridge forwards to the P2P layer. The bridge just needs to send/receive the protocol messages.

3. **Implement the protocol over your own signaling**  
   If you add a custom signaling server (or reuse an existing one), you can implement the same message schema and room semantics so that, once WebRTC connections are established, your client and the reference app can interoperate by sending the same JSON over data channels. The protocol doc is the contract.

## Message types and JSON

All payloads are JSON. Key points:

- **Lobby**: `heartbeat` (broadcast), `challenge` (to one peer), `challResp` (to challenger).
- **Game**: `move`, `chat`, `gameEvent`, `sync` — see [protocol.md](protocol.md) for field names and types.
- **FEN**: Must be valid standard FEN; validate before applying moves.
- **Timestamps**: Unix milliseconds; include in payloads for ordering.

## Room IDs

- Lobby: `p2p-chess-global` (default) or a custom room ID if you run a private lobby.
- Game: `p2p-chess-{gameId}` where `gameId` is the UUID from the challenge. Both players must join this room after accept.

## Community SDKs

If you build a client in another language that follows this protocol, we can list it in the main README as an unofficial/community SDK. Open an issue or PR with the link and a short description.
