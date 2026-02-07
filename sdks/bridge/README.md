# FediChess Bridge

Node.js stdio bridge for FediChess. Used by the Python, Rust, and C++ SDKs to join lobby/game rooms and send or receive protocol messages over WebRTC (Trystero). The bridge speaks **JSON Lines** (one JSON object per line) on stdin/stdout.

## Prerequisites

- **Node.js** 18+
- For WebRTC in Node: optional `wrtc` package (`npm install wrtc`). Without it, the bridge may only work in environments that provide WebRTC (e.g. some headless browser setups).

## Install and run

```bash
cd sdks/bridge
npm install
npm run build
npm start
```

Or from repo root:

```bash
node sdks/bridge/dist/index.js
```

(Ensure `sdks/bridge/node_modules` is installed and `sdks/bridge/dist` is built.)

## Protocol (stdio)

**Requests** (client → bridge), one JSON object per line:

| Command        | Payload              | Description                    |
|----------------|----------------------|--------------------------------|
| `joinLobby`    | —                    | Join lobby room                |
| `leaveLobby`   | —                    | Leave lobby                    |
| `joinGame`     | `gameId` (string)    | Join game room                 |
| `leaveGame`    | —                    | Leave game room                |
| `send`         | `action`, `payload`, optional `peerId` | Send protocol message |
| `getPeers`     | —                    | Return current room peer IDs   |

**Responses** (bridge → client): `{"ok": true}` or `{"ok": false, "error": "..."}`. For `getPeers`: `{"ok": true, "peers": ["id1", "id2"]}`.

**Events** (bridge → client, async): `{"event": "<action>", "peerId": "...", "payload": {...}}` for `heartbeat`, `challenge`, `challResp`, `move`, `chat`, `gameEvent`, `sync`, `history`, `histSync`, `role`, and `{"event": "peerJoin"|"peerLeave", "peerId": "..."}`.

## Environment

- `P2P_TRACKERS` — Comma-separated WSS tracker URLs (default: same as main app).

## Wire protocol

Same as the web app: [protocol.md](../../documentation/protocol.md). App ID `p2p-chess-v1`, lobby room `p2p-chess-global`, game room `p2p-chess-{gameId}`.
