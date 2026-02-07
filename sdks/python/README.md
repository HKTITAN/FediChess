# FediChess Python SDK

Python client for FediChess. Talks to the [FediChess bridge](../bridge/README.md) over stdio (JSON lines) to join lobby/game rooms and send or receive protocol messages.

## Prerequisites

- **Python** 3.9+
- **Node.js** 18+ and the bridge built (see [bridge/README.md](../bridge/README.md))

## Install

From this directory:

```bash
pip install -e .
```

Or add `sdks/python` to your path and import `fedichess`.

## Run the example

1. Build and start the bridge (in another terminal), or let the example spawn it:

   ```bash
   cd sdks/bridge && npm install && npm run build
   ```

2. Run the example (from repo root or `sdks/python`):

   ```bash
   python -m fedichess.examples.lobby_and_challenge
   ```

   Or:

   ```bash
   python sdks/python/examples/lobby_and_challenge.py
   ```

   Set `FEDICHESS_BRIDGE` to the path of `node sdks/bridge/dist/index.js` if the example cannot find the bridge.

## API

- `FediChessClient(bridge_path=..., bridge_cwd=...)` — create client; optional path to bridge script.
- `start_bridge()` — spawn the Node bridge process.
- `join_lobby()` / `leave_lobby()` — join or leave the lobby room.
- `join_game(game_id)` / `leave_game()` — join or leave a game room.
- `send(action, payload, peer_id=None)` — send a protocol message (e.g. `heartbeat`, `challenge`, `move`).
- `get_peers()` — list peer IDs in the current room.
- `events()` — iterator over incoming events; `poll_event(timeout)` for one event.
- `stop()` — terminate the bridge process.

Wire protocol: [protocol.md](../../documentation/protocol.md).
