/**
 * FediChess stdio bridge: JSON-lines over stdin/stdout.
 * Commands: joinLobby, leaveLobby, joinGame, leaveGame, send, getPeers.
 * Events: heartbeat, challenge, challResp, move, chat, gameEvent, sync, history, histSync, role, peerJoin, peerLeave.
 */
import { createInterface } from "readline";
import { LOBBY_ROOM, P2P_APP_ID, TRACKERS } from "./constants.js";

type TrysteroRoom = {
  makeAction: (actionName: string) => [
    send: (payload: unknown, peerId?: string) => void,
    get: (cb: (data: unknown, peerId: string) => void) => void,
  ];
  getPeers: () => Record<string, unknown> | string[];
  onPeerJoin: (cb: (peerId: string) => void) => void;
  onPeerLeave: (cb: (peerId?: string) => void) => void;
  leave: () => void;
};

function log(line: string): void {
  const out = JSON.stringify(line) + "\n";
  process.stderr.write(out);
}

function out(obj: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

async function getTrystero(): Promise<typeof import("trystero/torrent")> {
  if (typeof globalThis !== "undefined" && !(globalThis as unknown as { RTCPeerConnection?: unknown }).RTCPeerConnection) {
    try {
      const wrtc = await import("wrtc");
      (globalThis as unknown as { RTCPeerConnection: unknown }).RTCPeerConnection = wrtc.RTCPeerConnection;
      (globalThis as unknown as { RTCSessionDescription: unknown }).RTCSessionDescription = wrtc.RTCSessionDescription;
      (globalThis as unknown as { RTCIceCandidate: unknown }).RTCIceCandidate = wrtc.RTCIceCandidate;
    } catch {
      log("wrtc not available; WebRTC may not work in Node. Install optional dependency: npm install wrtc");
    }
  }
  return import("trystero/torrent");
}

let lobbyRoom: TrysteroRoom | null = null;
let gameRoom: TrysteroRoom | null = null;
let currentRoom: TrysteroRoom | null = null;

function peerIds(room: TrysteroRoom): string[] {
  const peers = room.getPeers();
  return Array.isArray(peers) ? peers : Object.keys(peers);
}

function setupRoomListeners(room: TrysteroRoom, roomLabel: string): void {
  const actions = [
    "heartbeat",
    "challenge",
    "challResp",
    "move",
    "chat",
    "gameEvent",
    "sync",
    "history",
    "histSync",
    "role",
  ];
  for (const action of actions) {
    const [, get] = room.makeAction(action);
    get((data, peerId) => {
      out({ event: action, peerId, payload: data });
    });
  }
  room.onPeerJoin((peerId) => {
    out({ event: "peerJoin", peerId, payload: null });
  });
  room.onPeerLeave((peerId) => {
    out({ event: "peerLeave", peerId: peerId ?? null, payload: null });
  });
}

async function joinLobby(): Promise<void> {
  const { joinRoom } = await getTrystero();
  if (lobbyRoom) {
    lobbyRoom.leave();
    lobbyRoom = null;
  }
  const room = joinRoom(
    {
      appId: P2P_APP_ID,
      relayUrls: TRACKERS,
      relayRedundancy: Math.min(3, TRACKERS.length),
    },
    LOBBY_ROOM
  ) as unknown as TrysteroRoom;
  lobbyRoom = room;
  currentRoom = room;
  setupRoomListeners(room, "lobby");
}

function leaveLobby(reply?: (obj: Record<string, unknown>) => void): void {
  if (lobbyRoom) {
    const wasCurrent = currentRoom === lobbyRoom;
    lobbyRoom.leave();
    lobbyRoom = null;
    if (wasCurrent) currentRoom = null;
  }
  if (reply) reply({ ok: true });
}

async function joinGame(gameId: string): Promise<void> {
  const { joinRoom } = await getTrystero();
  if (gameRoom) {
    gameRoom.leave();
    gameRoom = null;
  }
  const roomId = `p2p-chess-${gameId}`;
  const room = joinRoom(
    {
      appId: P2P_APP_ID,
      relayUrls: TRACKERS,
      relayRedundancy: Math.min(3, TRACKERS.length),
    },
    roomId
  ) as unknown as TrysteroRoom;
  gameRoom = room;
  currentRoom = room;
  setupRoomListeners(room, "game");
}

function leaveGame(reply?: (obj: Record<string, unknown>) => void): void {
  if (gameRoom) {
    const wasCurrent = currentRoom === gameRoom;
    gameRoom.leave();
    gameRoom = null;
    if (wasCurrent) currentRoom = null;
  }
  if (reply) reply({ ok: true });
}

function send(
  action: string,
  payload: unknown,
  peerId?: string,
  reply?: (obj: Record<string, unknown>) => void
): void {
  if (!currentRoom) {
    if (reply) reply({ ok: false, error: "No room joined (joinLobby or joinGame first)" });
    return;
  }
  const [sendFn] = currentRoom.makeAction(action);
  if (peerId) {
    (sendFn as (p: unknown, id: string) => void)(payload, peerId);
  } else {
    const peers = peerIds(currentRoom);
    peers.forEach((id) => {
      (sendFn as (p: unknown, id: string) => void)(payload, id);
    });
  }
  if (reply) reply({ ok: true });
}

function getPeers(requestId: unknown, reply: (obj: Record<string, unknown>) => void): void {
  reply(withId({ ok: true, peers: currentRoom ? peerIds(currentRoom) : [] }, requestId));
}

function withId(obj: Record<string, unknown>, id: unknown): Record<string, unknown> {
  if (id !== undefined) return { ...obj, id };
  return obj;
}

async function handleLine(line: string): Promise<void> {
  let msg: { cmd: string; id?: unknown; gameId?: string; action?: string; payload?: unknown; peerId?: string };
  try {
    msg = JSON.parse(line) as { cmd: string; id?: unknown; gameId?: string; action?: string; payload?: unknown; peerId?: string };
  } catch {
    out({ ok: false, error: "Invalid JSON" });
    return;
  }
  const { cmd, id } = msg;
  const reply = (obj: Record<string, unknown>) => out(withId(obj, id));
  try {
    switch (cmd) {
      case "joinLobby":
        await joinLobby();
        reply({ ok: true });
        break;
      case "leaveLobby":
        leaveLobby(reply);
        break;
      case "joinGame":
        if (typeof msg.gameId !== "string") {
          reply({ ok: false, error: "joinGame requires gameId" });
          return;
        }
        await joinGame(msg.gameId);
        reply({ ok: true });
        break;
      case "leaveGame":
        leaveGame(reply);
        break;
      case "send":
        if (typeof msg.action !== "string") {
          reply({ ok: false, error: "send requires action" });
          return;
        }
        send(msg.action, msg.payload ?? {}, msg.peerId, reply);
        break;
      case "getPeers":
        getPeers(id, reply);
        break;
      default:
        reply({ ok: false, error: `Unknown command: ${cmd}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    reply({ ok: false, error: message });
  }
}

async function main(): Promise<void> {
  const rl = createInterface({ input: process.stdin, terminal: false });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) await handleLine(trimmed);
  }
}

main().catch((err) => {
  log(String(err));
  process.exit(1);
});
