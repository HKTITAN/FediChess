# FediChess Rust SDK

Rust client for FediChess. Talks to the [FediChess bridge](../bridge/README.md) over stdio (JSON lines) to join lobby/game rooms and send or receive protocol messages.

## Prerequisites

- **Rust** (1.70+)
- **Node.js** 18+ and the bridge built (see [bridge/README.md](../bridge/README.md))

## Build

```bash
cd sdks/rust
cargo build
```

## Run the example

1. Build the bridge:

   ```bash
   cd sdks/bridge && npm install && npm run build
   ```

2. From `sdks/rust`:

   ```bash
   cargo run --example lobby_and_challenge
   ```

   Set `FEDICHESS_BRIDGE` to the path of the bridge script if the example cannot find it.

## API

- `FediChessClient::new(bridge_path, bridge_cwd)` — create client; spawns the bridge process.
- `join_lobby()` / `leave_lobby()` — join or leave the lobby room.
- `join_game(game_id)` / `leave_game()` — join or leave a game room.
- `send(action, payload, peer_id)` — send a protocol message.
- `get_peers()` — list peer IDs in the current room.
- `poll_event()` — return one queued event if available.
- `stop()` — terminate the bridge (also on drop).

Wire protocol: [protocol.md](../../documentation/protocol.md).
