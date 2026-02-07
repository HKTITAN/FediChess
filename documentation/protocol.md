# P2P Chess Wire Protocol

This document defines the wire protocol used by P2P Chess clients. Any client (web, mobile, CLI, or other platform) that implements this protocol can discover peers, send and receive challenges, and play games interoperably.

## Transport

- **Discovery and signaling**: WebTorrent-compatible trackers (WSS). Clients join a "room" (see below) via Trystero (or a compatible WebRTC matchmaking layer) using the torrent strategy with the same `appId` and `relayUrls`.
- **Data**: JSON payloads sent over Trystero actions (peer-to-peer after WebRTC connection). Action type strings must be **≤12 bytes** (Trystero constraint).

## Rooms

| Room type   | Room ID format        | Purpose |
|------------|------------------------|---------|
| Lobby      | `p2p-chess-global` (default) or custom | Discovery: peers broadcast heartbeats; challenges are sent/received here. |
| Game       | `p2p-chess-{gameId}`   | One game per UUID `gameId`. Players and spectators join; only the two designated players may send moves or game events. |

- **App ID**: `p2p-chess-v1` (shared by all compatible clients).
- **Lobby directory** (optional): A list of public lobbies (room IDs + optional tracker URLs) can be hosted as static JSON or an API. Clients may fetch this to offer "Global lobby" vs "Community X" and join the same logical pool. Format: `{ "lobbies": [ { "id": "p2p-chess-global", "label": "Global", "trackers": [] } ] }` — empty `trackers` means use client default.

## Action types and payloads

All payloads are JSON. Optional fields may be omitted.

### Lobby room

| Action (≤12 bytes) | Direction | Payload shape | Description |
|--------------------|-----------|---------------|-------------|
| `heartbeat`        | Broadcast | `HeartbeatPayload` | Periodic presence: ELO, username, ready. |
| `challenge`        | To peer   | `ChallengePayload` | Request to start a game (challenger sends to one peer). |
| `challResp`        | To peer   | `ChallengeResponsePayload` | Accept or decline a challenge. |

**HeartbeatPayload**

```json
{
  "id": "<uuid>",
  "elo": 1200,
  "name": "HKTITAN",
  "ready": true,
  "timestamp": 1234567890123
}
```

- `name`: Display username (visible to others in the lobby).
- `timestamp`: Unix ms; used for ordering/freshness.

**ChallengePayload**

```json
{
  "type": "challenge",
  "gameId": "<uuid>",
  "challengerId": "self",
  "challengerName": "HKTITAN",
  "challengerElo": 1200,
  "color": "w",
  "timestamp": 1234567890123
}
```

- `gameId`: Unique ID for the game; game room will be `p2p-chess-{gameId}`.
- `color`: `"w"` (challenger plays white) or `"b"` (challenger plays black).

**ChallengeResponsePayload**

```json
{ "type": "accept", "gameId": "<uuid>", "timestamp": 1234567890123 }
```
or
```json
{ "type": "decline", "gameId": "<uuid>", "timestamp": 1234567890123 }
```

### Game room

| Action (≤12 bytes) | Direction | Payload shape | Description |
|--------------------|-----------|---------------|-------------|
| `role`             | To peer(s) | `RolePayload` | Announce player (white/black) or spectator; used to establish who may send moves. |
| `move`             | To peer(s) | `MovePayload` | New FEN and optional SAN after a move. **Only from designated white or black player.** |
| `chat`             | To peer(s) | `ChatPayload` | Chat message. |
| `gameEvent`        | To peer(s) | `GameEventPayload` | Resign, draw offer/accept/decline. **Only from designated white or black player.** |
| `sync`             | To peer   | `SyncPayload` | Full FEN sync (e.g. when peer joins; sender is typically white). |
| `history`          | To peer(s) | `GameLogEvent` | One append-only game event (move, resign, drawOffer, drawAccept, drawDecline) with `seq`. |
| `histSync`         | To peer   | `HistorySyncPayload` | Full game event log for late joiners (players or spectators). |

**RolePayload**

```json
{ "role": "player", "color": "w", "peerId": "<peer-id>" }
```
or
```json
{ "role": "spectator", "peerId": "<peer-id>" }
```

- Sent on join and when a new peer joins. Establishes `whitePeerId` and `blackPeerId`; only those two peers may send `move` and `gameEvent`. Spectators are read-only.

**GameLogEvent** (single event in the shared log)

- Move: `{ "seq": 1, "kind": "move", "fen": "<fen>", "san": "e4", "timestamp": 1234567890123 }`
- Resign: `{ "seq": 2, "kind": "resign", "timestamp": 1234567890123 }`
- Draw: `{ "seq": 2, "kind": "drawOffer" | "drawAccept" | "drawDecline", "timestamp": 1234567890123 }`

**HistorySyncPayload**

```json
{ "events": [ <GameLogEvent>, ... ] }
```

- Sent to new joiners (including spectators) so they receive the full event log and can derive board state. Receivers apply events in `seq` order; duplicate or out-of-order events are ignored.

**MovePayload**

```json
{
  "type": "move",
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "san": "e4",
  "timestamp": 1234567890123
}
```

**ChatPayload**

```json
{
  "type": "chat",
  "text": "Hello",
  "peerId": "<sender-peer-id>",
  "timestamp": 1234567890123
}
```

**GameEventPayload**

One of:

- `{ "type": "resign", "timestamp": 1234567890123 }`
- `{ "type": "drawOffer", "timestamp": 1234567890123 }`
- `{ "type": "drawAccept", "timestamp": 1234567890123 }`
- `{ "type": "drawDecline", "timestamp": 1234567890123 }`

**SyncPayload**

```json
{
  "type": "sync",
  "fen": "<standard FEN>",
  "timestamp": 1234567890123
}
```

- Used to bring a newly joined peer (e.g. black) up to date; typically sent by white on `onPeerJoin`.

## Flows

### Discovery and challenge

1. All clients in a lobby join the same room ID (e.g. `p2p-chess-global`) with the same app ID and trackers.
2. Each client sends periodic `heartbeat` with its ELO, username, and timestamp; and subscribes to `heartbeat` to build a peer list.
3. Client A picks Client B from the list and sends `challenge` (with `gameId`, color, etc.) to B.
4. B sends `challResp` with `type: "accept"` or `type: "decline"` to A.
5. On accept: both navigate (or programmatically join) the game room `p2p-chess-{gameId}`. One plays white, one black (agreed via challenge: challenger is white by default in this implementation).

### Game

1. Clients join the game room as **player** (with `color=w` or `color=b` from the challenge) or **spectator** (e.g. `spectate=1` or no color). Each joiner sends a `role` message (player + color, or spectator) so all peers know `whitePeerId` and `blackPeerId`.
2. Only the two designated players may send `move` and `gameEvent`; spectators are read-only. Receivers ignore `move`/`gameEvent` from any peer that is not white or black.
3. **Shared event log**: Each move or game event is broadcast as a `history` payload (with monotonic `seq`). All participants (players and spectators) receive the same log. New joiners receive the full log via `histSync` so board state is consistent. FEN and result are derived by replaying the log in order.
4. White sends `sync` (initial FEN) and, when the log is non-empty, `histSync` to new joiners.
5. Chat: any participant may send `chat`.

## Constraints

- **Action type strings**: Must be ≤12 bytes (UTF-8). Use e.g. `challResp` instead of `challengeResponse`, `histSync` for history sync.
- **FEN**: Must be valid standard FEN; receivers should validate before applying.
- **Timestamps**: Unix milliseconds; used for ordering and optional conflict resolution.
- **Security**: Only accept `move` and `gameEvent` from peers that have announced themselves as the white or black player via `role`. Spectators must not send move or gameEvent.

## Reference

- App ID: `p2p-chess-v1`
- Default lobby room: `p2p-chess-global`
- Game room: `p2p-chess-{gameId}` where `gameId` is a UUID from the challenge.
