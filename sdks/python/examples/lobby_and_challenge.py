#!/usr/bin/env python3
"""
Example: join lobby, send heartbeat, list peers, optionally send a challenge.
Run the bridge first (see sdks/bridge/README.md), then from repo root or sdks/python:
  python -m fedichess.examples.lobby_and_challenge
  or: python sdks/python/examples/lobby_and_challenge.py
"""
import os
import sys
import time

# Add parent so we can import fedichess
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fedichess import FediChessClient


def main() -> None:
    # Prefer bridge next to this repo (sdks/bridge/dist/index.js)
    # From sdks/python/examples/ -> sdks/bridge
    bridge_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "bridge")
    bridge_path = os.path.join(bridge_dir, "dist", "index.js")
    if not os.path.isfile(bridge_path):
        bridge_path = os.environ.get("FEDICHESS_BRIDGE", "node")

    client = FediChessClient(bridge_path=bridge_path, bridge_cwd=bridge_dir if os.path.isdir(bridge_dir) else None)
    client.start_bridge()

    r = client.join_lobby()
    if not r.get("ok"):
        print("join_lobby failed:", r.get("error", r))
        return

    # Send heartbeat so we appear in the lobby
    client.send("heartbeat", {
        "id": "sdk-python-example",
        "elo": 1200,
        "name": "PythonSDK",
        "ready": True,
        "timestamp": int(time.time() * 1000),
    })

    # Drain a few events (optional)
    for _ in range(3):
        ev = client.poll_event(timeout=2.0)
        if ev:
            print("Event:", ev.get("event"), ev.get("peerId", ""), ev.get("payload"))

    peers = client.get_peers()
    print("Peers in lobby:", peers)

    if peers:
        # Optional: send a challenge to the first peer
        import uuid
        game_id = str(uuid.uuid4())
        client.send("challenge", {
            "type": "challenge",
            "gameId": game_id,
            "challengerId": "sdk-python-example",
            "challengerName": "PythonSDK",
            "challengerElo": 1200,
            "color": "w",
            "timestamp": int(time.time() * 1000),
        }, peer_id=peers[0])
        print("Sent challenge to", peers[0], "gameId", game_id)
        # Wait for challResp
        for _ in range(10):
            ev = client.poll_event(timeout=2.0)
            if ev and ev.get("event") == "challResp":
                print("challResp:", ev.get("payload"))
                break

    client.leave_lobby()
    client.stop()
    print("Done.")


if __name__ == "__main__":
    main()
