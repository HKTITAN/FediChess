# SDK guide — building clients in any language

This guide explains how to build a FediChess client in any language (JavaScript/TypeScript, Python, Go, Rust, etc.) so it can discover peers, send and receive challenges, and play games with the reference web app and other compatible clients.

## Prerequisites

- **Protocol**: Read the [wire protocol](protocol.md). All clients must use the same room IDs, action type names (≤12 bytes), and JSON payload shapes.
- **Transport**: Peers discover each other via WebTorrent-compatible WSS trackers and then connect over WebRTC data channels. Your client needs a way to:
  1. Connect to the same trackers (e.g. `wss://tracker.webtorrent.dev`, `wss://tracker.openwebtorrent.com`, `wss://tracker.btorrent.xyz`) and join the same **app ID** (`p2p-chess-v1`) and **room IDs** (lobby: `p2p-chess-global`, game: `p2p-chess-{gameId}`).
  2. Exchange WebRTC offers/answers (signaling) and open data channels to send/receive JSON messages.

## JavaScript / TypeScript

The reference implementation is the Next.js app in this repo. To build a minimal SDK or another JS client:

- Use **Trystero** with the **torrent** strategy (or another strategy that shares the same room semantics). Join the lobby room, register actions for `heartbeat`, `challenge`, `challResp`; in game room register `move`, `chat`, `gameEvent`, `sync`, `role`, `history`, `histSync`.
- Use the exact action names and payload shapes from [protocol.md](protocol.md). Action names must be ≤12 bytes (e.g. `challResp` not `challengeResponse`).
- Reuse the same tracker list (or `NEXT_PUBLIC_P2P_TRACKERS` override). Pass the same `appId` and `relayUrls` into Trystero so you join the same logical rooms as the web app.

### Official JS/TS surface (reference implementation)

The app exposes a single transport abstraction so lobby and game code work over both WebRTC and BLE:

| Entry point | Purpose |
|-------------|---------|
| `lib/p2p.ts` | WebRTC rooms (Trystero), action types and payloads, `getRoom`, `getLobbyRoom`, `getGameRoom`, `getLobbyRoomBle`, `getGameRoomBle`, `storeBleGameRoom`, `isP2PSupported`, `getShareableLink`. |
| `lib/transport-types.ts` | **Room** interface: `makeAction(name) → [send, get]`, `getPeers()`, `onPeerJoin`, `onPeerLeave`, `leave()`. Same API for lobby and game. |
| `lib/ble-transport.ts` | BLE GATT room (1:1), `createBleRoom`, `requestBleDevice`, `isBleSupported`. See [protocol](protocol.md) for service/characteristic UUIDs and message format. |
| `lib/constants.ts` | `P2P_APP_ID`, `LOBBY_ROOM`, default trackers, `getIceServers()`. Override via `NEXT_PUBLIC_P2P_TRACKERS`, `NEXT_PUBLIC_STUN_URL`, etc. |

### BLE (Web Bluetooth)

The same wire protocol runs over BLE for nearby play. The browser acts as a **central** only (initiates connection); the other side must be a **peripheral** advertising the FediChess GATT service (UUIDs in [protocol.md](protocol.md)). Flow: user clicks "Connect via BLE" → device picker → connect → heartbeats over BLE; one peer appears as "Nearby". Challenge and accept over the same BLE connection; on accept the app stores the BLE room and navigates to the game so the game reuses that connection. Scope is 1:1 (one BLE peer per connection). See `lib/ble-transport.ts` for the implementation and [protocol (BLE)](protocol.md#2-ble-web-bluetooth) for the message format.

### Official npm package (optional)

We may later publish an npm package (e.g. `@fedichess/sdk` or `fedichess`) that exposes only room join and send/receive for each action (no UI). Until then, use this repo as the reference and the modules above as the official JS/TS surface.

## Community / repo SDKs (Python, Rust, C++)

This repo includes SDKs for **Python**, **Rust**, and **C++** that use a shared **bridge** (Node/TypeScript) to talk to the same WebRTC/tracker layer as the web app. You run the bridge once; each SDK spawns it and communicates over stdio (JSON lines).

- **Bridge:** [sdks/bridge/](../sdks/bridge/README.md) — commands: `joinLobby`, `leaveLobby`, `joinGame`, `leaveGame`, `send`, `getPeers`; events: `heartbeat`, `challenge`, `challResp`, `move`, etc.
- **Python:** [sdks/python/](../sdks/python/README.md) — `FediChessClient`, example: join lobby, heartbeat, list peers, send challenge.
- **Rust:** [sdks/rust/](../sdks/rust/README.md) — `fedichess_sdk` crate, example: same flow.
- **C++:** [sdks/cpp/](../sdks/cpp/README.md) — `FediChessClient`, CMake, example: same flow.

Overview and quick start: [sdks/README.md](../sdks/README.md). Prerequisites: Node.js (for the bridge) and the language toolchain for the SDK you use.

## Other languages (e.g. Go)

There is no central server: discovery and signaling go through WebTorrent trackers and WebRTC. Options:

1. **Use this repo’s bridge**  
   Implement a small client in your language that spawns the [bridge](../sdks/bridge/README.md) and speaks the same stdio JSON-lines protocol. See [sdks/README.md](../sdks/README.md) and the Python/Rust/C++ SDKs as reference.

2. **Use a WebRTC + WebTorrent library in your language**  
   If one exists (e.g. for Node or native), implement the same flow: connect to the WSS trackers, join room `p2p-chess-global` with app ID `p2p-chess-v1`, and exchange the same JSON messages. The [protocol](protocol.md) defines all message types and payloads.

3. **Implement the protocol over your own signaling**  
   If you add a custom signaling server (or reuse an existing one), you can implement the same message schema and room semantics so that, once WebRTC connections are established, your client and the reference app can interoperate by sending the same JSON over data channels. The protocol doc is the contract.

## Message types and JSON

All payloads are JSON. Key points:

- **Lobby**: `heartbeat` (broadcast), `challenge` (to one peer), `challResp` (to challenger).
- **Game**: `role`, `move`, `chat`, `gameEvent`, `sync`, `history`, `histSync` — see [protocol.md](protocol.md) for field names and types.
- **FEN**: Must be valid standard FEN; validate before applying moves.
- **Timestamps**: Unix milliseconds; include in payloads for ordering.

## Room IDs

- Lobby: `p2p-chess-global` (default) or a custom room ID if you run a private lobby.
- Game: `p2p-chess-{gameId}` where `gameId` is the UUID from the challenge. Both players must join this room after accept.

## Community SDKs

If you build a client in another language that follows this protocol, we can list it in the main README as an unofficial/community SDK. Open an issue or PR with the link and a short description.
