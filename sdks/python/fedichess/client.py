"""
FediChess bridge client: spawns the Node bridge and sends/receives JSON-lines.
"""
import json
import os
import queue
import subprocess
import threading
import uuid
from pathlib import Path
from typing import Any, Iterator, Optional


def _find_bridge() -> str:
    """Path to the bridge entry script (dist/index.js)."""
    root = Path(__file__).resolve().parent
    for base in [root, root.parent.parent.parent]:
        candidate = base / "bridge" / "dist" / "index.js"
        if candidate.is_file():
            return str(candidate)
        candidate = base / "sdks" / "bridge" / "dist" / "index.js"
        if candidate.is_file():
            return str(candidate)
    return os.environ.get("FEDICHESS_BRIDGE", "node")


class FediChessClient:
    """
    Client that talks to the FediChess Node bridge over stdio.
    Start the bridge yourself or use start_bridge().
    """

    def __init__(
        self,
        bridge_path: Optional[str] = None,
        bridge_cwd: Optional[str] = None,
    ) -> None:
        self._bridge_path = bridge_path or _find_bridge()
        self._bridge_cwd = bridge_cwd
        self._process: Optional[subprocess.Popen] = None
        self._event_queue: queue.Queue = queue.Queue()
        self._reader_thread: Optional[threading.Thread] = None

    def start_bridge(self) -> None:
        """Spawn the bridge process. Uses bridge_path and bridge_cwd."""
        cwd = self._bridge_cwd
        if not cwd and os.path.isfile(self._bridge_path):
            cwd = str(Path(self._bridge_path).parent.parent)
        self._process = subprocess.Popen(
            ["node", self._bridge_path] if os.path.isfile(self._bridge_path) else [self._bridge_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            cwd=cwd,
        )

        def read_stdout() -> None:
            assert self._process and self._process.stdout
            for line in self._process.stdout:
                line = line.rstrip("\n")
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    if "event" in obj:
                        self._event_queue.put(obj)
                except json.JSONDecodeError:
                    pass

        self._reader_thread = threading.Thread(target=read_stdout, daemon=True)
        self._reader_thread.start()

    def _send(self, obj: dict[str, Any]) -> dict[str, Any]:
        if not self._process or not self._process.stdin:
            raise RuntimeError("Bridge not started; call start_bridge() first")
        req_id = str(uuid.uuid4())
        obj["id"] = req_id
        self._process.stdin.write(json.dumps(obj) + "\n")
        self._process.stdin.flush()
        while True:
            if not self._process.stdout:
                return {"ok": False, "error": "No stdout"}
            line = self._process.stdout.readline()
            if not line:
                return {"ok": False, "error": "No response"}
            try:
                resp = json.loads(line.rstrip("\n"))
            except json.JSONDecodeError:
                continue
            if resp.get("id") == req_id:
                return resp
            if "event" in resp:
                self._event_queue.put(resp)

    def join_lobby(self) -> dict[str, Any]:
        return self._send({"cmd": "joinLobby"})

    def leave_lobby(self) -> dict[str, Any]:
        return self._send({"cmd": "leaveLobby"})

    def join_game(self, game_id: str) -> dict[str, Any]:
        return self._send({"cmd": "joinGame", "gameId": game_id})

    def leave_game(self) -> dict[str, Any]:
        return self._send({"cmd": "leaveGame"})

    def send(self, action: str, payload: dict[str, Any], peer_id: Optional[str] = None) -> dict[str, Any]:
        obj: dict[str, Any] = {"cmd": "send", "action": action, "payload": payload}
        if peer_id is not None:
            obj["peerId"] = peer_id
        return self._send(obj)

    def get_peers(self) -> list[str]:
        out = self._send({"cmd": "getPeers"})
        if out.get("ok") and "peers" in out:
            return list(out["peers"])
        return []

    def events(self) -> Iterator[dict[str, Any]]:
        """Yield events from the bridge (heartbeat, challenge, etc.)."""
        while True:
            try:
                yield self._event_queue.get(timeout=0.1)
            except queue.Empty:
                continue

    def poll_event(self, timeout: float = 0.0) -> Optional[dict[str, Any]]:
        """Return one event if available, else None."""
        try:
            return self._event_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def stop(self) -> None:
        if self._process:
            self._process.terminate()
            self._process.wait(timeout=2)
            self._process = None
