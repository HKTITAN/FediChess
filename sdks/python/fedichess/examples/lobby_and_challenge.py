#!/usr/bin/env python3
"""
Example: join lobby, send heartbeat, list peers, optionally send a challenge.
Run the bridge first (see sdks/bridge/README.md). From sdks/python:
  python -m fedichess.examples.lobby_and_challenge
"""
import os
import sys
import time
import uuid

from fedichess import FediChessClient


def main() -> None:
    # Bridge at sdks/bridge/dist/index.js (relative to this file: ../../bridge)
    this_dir = os.path.dirname(os.path.abspath(__file__))
    bridge_dir = os.path.join(this_dir, "..", "..", "..", "bridge")
    bridge_path = os.path.join(bridge_dir, "dist", "index.js")
    if not os.path.isfile(bridge_path):
        bridge_path = os.environ.get("FEDICHESS_BRIDGE", "node")
    bridge_cwd = bridge_dir if os.path.isdir(bridge_dir) else None

    client = FediChessClient(bridge_path=bridge_path, bridge_cwd=bridge_cwd)
    client.start_bridge()

    r = client.join_lobby()
    if not r.get("ok"):
        print("join_lobby failed:", r.get("error", r))
        return

    client.send("heartbeat", {
        "id": "sdk-python-example",
        "elo": 1200,
        "name": "PythonSDK",
        "ready": True,
        "timestamp": int(time.time() * 1000),
    })

    for _ in range(3):
        ev = client.poll_event(timeout=2.0)
        if ev:
            print("Event:", ev.get("event"), ev.get("peerId", ""), ev.get("payload"))

    peers = client.get_peers()
    print("Peers in lobby:", peers)

    if peers:
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
