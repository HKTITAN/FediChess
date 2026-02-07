# FediChess C++ SDK

C++ client for FediChess. Talks to the [FediChess bridge](../bridge/README.md) over stdio (JSON lines) to join lobby/game rooms and send or receive protocol messages.

## Prerequisites

- **C++14** compiler (e.g. GCC, Clang, MSVC)
- **CMake** 3.14+
- **Node.js** 18+ and the bridge built (see [bridge/README.md](../bridge/README.md))

nlohmann/json is fetched automatically by CMake.

## Build

```bash
cd sdks/cpp
mkdir build && cd build
cmake ..
cmake --build .
```

## Run the example

1. Build the bridge:

   ```bash
   cd sdks/bridge && npm install && npm run build
   ```

2. From `sdks/cpp/build`:

   ```bash
   ./lobby_and_challenge
   ```

   Or set `FEDICHESS_BRIDGE` to the path of the bridge script (e.g. `node /path/to/sdks/bridge/dist/index.js`).

## API

- `FediChessClient(bridge_path, bridge_cwd)` — construct client.
- `start_bridge()` — spawn the Node bridge process; returns true on success.
- `join_lobby()` / `leave_lobby()` — join or leave the lobby room (returns JSON response).
- `join_game(game_id)` / `leave_game()` — join or leave a game room.
- `send(action, payload, peer_id)` — send a protocol message; peer_id optional.
- `get_peers()` — list peer IDs in the current room.
- `poll_event(timeout_sec)` — return one event if available within timeout (0 = non-blocking).
- `stop()` — terminate the bridge.

Wire protocol: [protocol.md](../../documentation/protocol.md).
