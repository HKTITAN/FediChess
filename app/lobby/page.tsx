"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import {
  getLobbyRoom,
  getGameRoom,
  leaveRoom,
  getShareableLink,
  getLobbyRoomBle,
  storeBleGameRoom,
  isBleSupported,
  requestBleDevice,
} from "@/lib/p2p";
import { copyToClipboard } from "@/lib/clipboard";
import type {
  HeartbeatPayload,
  ChallengePayload,
  ChallengeResponsePayload,
} from "@/lib/p2p";
import {
  LOBBY_ROOM,
  HEARTBEAT_INTERVAL_MS,
  MAX_PEERS_DISPLAYED,
  ELO_RANGE,
} from "@/lib/constants";
import { useUserStore, useLobbyStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LobbyPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen p-4">Loading lobby…</div>}>
      <LobbyContent />
    </React.Suspense>
  );
}

function LobbyContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room") ?? LOBBY_ROOM;
  const hashElo = React.useMemo(() => {
    if (typeof window === "undefined") return 1200;
    const hash = window.location.hash;
    const m = hash.match(/elo=(\d+)/);
    return m ? parseInt(m[1], 10) : 1200;
  }, []);

  const { elo, name, setName, setElo, peakElo, hydrateFromStorage } =
    useUserStore();
  const {
    peers,
    addOrUpdatePeer,
    removePeer,
    pendingChallenge,
    setPendingChallenge,
    clearPendingChallenge,
  } = useLobbyStore();

  const [loading, setLoading] = React.useState(true);
  const [p2pError, setP2pError] = React.useState<string | null>(null);
  const [link, setLink] = React.useState("");
  const [challengingId, setChallengingId] = React.useState<string | null>(null);
  const [bleConnecting, setBleConnecting] = React.useState(false);
  const [bleConnected, setBleConnected] = React.useState(false);
  const [bleError, setBleError] = React.useState<string | null>(null);
  const [pendingChallengeTransport, setPendingChallengeTransport] = React.useState<"webrtc" | "ble" | null>(null);
  const bleLobbyRoomRef = React.useRef<{ room: Awaited<ReturnType<typeof getLobbyRoomBle>>["room"]; selfPeerId: string } | null>(null);
  const bleHeartbeatTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const clearBleLobby = React.useCallback(() => {
    if (bleHeartbeatTimerRef.current) {
      clearInterval(bleHeartbeatTimerRef.current);
      bleHeartbeatTimerRef.current = null;
    }
    const ble = bleLobbyRoomRef.current;
    if (ble) {
      ble.room.leave();
      bleLobbyRoomRef.current = null;
    }
    setBleConnected(false);
    setBleError(null);
    useLobbyStore.getState().peers.filter((p) => p.transport === "ble").forEach((p) => removePeer(p.id));
  }, [removePeer]);

  React.useEffect(() => {
    hydrateFromStorage();
    if (hashElo > 0) setElo(hashElo);
  }, [hashElo, hydrateFromStorage, setElo]);

  React.useEffect(() => {
    setLink(getShareableLink(roomParam, elo));
  }, [roomParam, elo]);

  React.useEffect(() => {
    let heartbeatTimer: ReturnType<typeof setInterval>;
    let mounted = true;

    const run = async () => {
      let room: Awaited<ReturnType<typeof getLobbyRoom>>;
      try {
        room = await getLobbyRoom();
      } catch (err) {
        if (!mounted) return;
        setP2pError(err instanceof Error ? err.message : "P2P unavailable. Use HTTPS or localhost.");
        setLoading(false);
        return;
      }
      const [sendHeartbeat, getHeartbeat] = room.makeAction("heartbeat");
      const [sendChallenge, getChallenge] = room.makeAction("challenge");
      const [sendChallengeResponse, getChallengeResponse] =
        room.makeAction("challResp");

      getHeartbeat((data: unknown, peerId: string) => {
        if (!mounted) return;
        const d = data as HeartbeatPayload;
        if (d && typeof d.elo === "number")
          addOrUpdatePeer({
            id: peerId,
            elo: d.elo,
            name: String(d.name ?? "Player"),
            ready: Boolean(d.ready),
            timestamp: Number(d.timestamp ?? 0),
            transport: "webrtc",
          });
      });

      getChallenge((data: unknown, peerId: string) => {
        const d = data as ChallengePayload;
        if (!mounted || !d) return;
        setPendingChallengeTransport("webrtc");
        setPendingChallenge({
          gameId: d.gameId,
          challengerId: peerId,
          challengerName: d.challengerName,
          challengerElo: d.challengerElo,
          color: d.color,
        });
      });

      getChallengeResponse((data: unknown, peerId: string) => {
        const d = data as ChallengeResponsePayload;
        if (!mounted || !d) return;
        setChallengingId(null);
        setWaitingForGameId(null);
        if (d.type === "accept") {
          const peer = useLobbyStore.getState().peers.find((p) => p.id === peerId);
          const params = new URLSearchParams({
            room: d.gameId,
            color: "w",
            oppElo: String(peer?.elo ?? 1200),
            oppName: peer?.name ?? "Opponent",
          });
          window.location.href = `/game?${params}`;
        }
      });

      room.onPeerLeave((peerId) => {
        if (mounted) removePeer(peerId);
      });

      const sendMyHeartbeat = () => {
        sendHeartbeat({
          id: uuidv4(),
          elo,
          name: name.trim() || "Player",
          ready: true,
          timestamp: Date.now(),
        });
      };

      sendMyHeartbeat();
      heartbeatTimer = setInterval(sendMyHeartbeat, HEARTBEAT_INTERVAL_MS);

      setLoading(false);

      return () => {
        mounted = false;
        clearInterval(heartbeatTimer);
        leaveRoom(roomParam);
      };
    };

    run().catch(console.error);

    return () => {
      mounted = false;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      leaveRoom(roomParam);
    };
  }, [roomParam, elo, name, addOrUpdatePeer, removePeer, setPendingChallenge]);

  const connectBle = React.useCallback(async () => {
    setBleError(null);
    setBleConnecting(true);
    try {
      if (bleLobbyRoomRef.current) clearBleLobby();
      const device = await requestBleDevice();
      const { room, selfPeerId } = await getLobbyRoomBle(device);
      bleLobbyRoomRef.current = { room, selfPeerId };
      const [sendHeartbeat, getHeartbeat] = room.makeAction("heartbeat");
      const [sendChallenge, getChallenge] = room.makeAction("challenge");
      const [sendChallengeResponse, getChallengeResponse] = room.makeAction("challResp");

      getHeartbeat((data: unknown, peerId: string) => {
        const d = data as HeartbeatPayload;
        if (d && typeof d.elo === "number")
          addOrUpdatePeer({
            id: peerId,
            elo: d.elo,
            name: String(d.name ?? "Player"),
            ready: Boolean(d.ready),
            timestamp: Number(d.timestamp ?? 0),
            transport: "ble",
          });
      });

      getChallenge((data: unknown, peerId: string) => {
        const d = data as ChallengePayload;
        if (!d) return;
        setPendingChallengeTransport("ble");
        setPendingChallenge({
          gameId: d.gameId,
          challengerId: peerId,
          challengerName: d.challengerName,
          challengerElo: d.challengerElo,
          color: d.color,
        });
      });

      getChallengeResponse((data: unknown, peerId: string) => {
        const d = data as ChallengeResponsePayload;
        if (!d) return;
        setChallengingId(null);
        setWaitingForGameId(null);
        if (d.type === "accept") {
          const bleRoom = bleLobbyRoomRef.current;
          if (!bleRoom) {
            setBleError("Connection lost before game start.");
            return;
          }
          storeBleGameRoom(bleRoom.room, d.gameId, bleRoom.selfPeerId);
          bleLobbyRoomRef.current = null;
          if (bleHeartbeatTimerRef.current) {
            clearInterval(bleHeartbeatTimerRef.current);
            bleHeartbeatTimerRef.current = null;
          }
          setBleConnected(false);
          const peer = useLobbyStore.getState().peers.find((p) => p.id === peerId);
          const params = new URLSearchParams({
            room: d.gameId,
            color: "w",
            oppElo: String(peer?.elo ?? 1200),
            oppName: peer?.name ?? "Opponent",
            transport: "ble",
          });
          window.location.href = `/game?${params}`;
        }
      });

      room.onPeerLeave((id) => {
        if (bleHeartbeatTimerRef.current) {
          clearInterval(bleHeartbeatTimerRef.current);
          bleHeartbeatTimerRef.current = null;
        }
        bleLobbyRoomRef.current = null;
        setBleConnected(false);
        if (id) {
          removePeer(id);
          if (useLobbyStore.getState().pendingChallenge?.challengerId === id) {
            clearPendingChallenge();
            setPendingChallengeTransport(null);
          }
        }
        setBleError("Disconnected from nearby device.");
      });

      const sendMyHeartbeat = () => {
        sendHeartbeat({
          id: selfPeerId,
          elo,
          name: name.trim() || "Player",
          ready: true,
          timestamp: Date.now(),
        });
      };
      sendMyHeartbeat();
      if (bleHeartbeatTimerRef.current) clearInterval(bleHeartbeatTimerRef.current);
      bleHeartbeatTimerRef.current = setInterval(sendMyHeartbeat, HEARTBEAT_INTERVAL_MS);
      setBleConnected(true);
      setBleError(null);
    } catch (err) {
      setBleError(err instanceof Error ? err.message : "BLE connection failed");
    } finally {
      setBleConnecting(false);
    }
  }, [elo, name, addOrUpdatePeer, removePeer, setPendingChallenge, clearPendingChallenge, clearBleLobby]);

  React.useEffect(() => {
    return () => {
      clearBleLobby();
    };
  }, [clearBleLobby]);

  const [showAllPeers, setShowAllPeers] = React.useState(false);

  const filteredPeers = React.useMemo(() => {
    const byElo = showAllPeers
      ? peers
      : peers.filter((p) => Math.abs(p.elo - elo) <= ELO_RANGE);
    return byElo.slice(0, MAX_PEERS_DISPLAYED);
  }, [peers, elo, showAllPeers]);

  const [waitingForGameId, setWaitingForGameId] = React.useState<string | null>(
    null
  );

  const handleChallenge = React.useCallback(
    async (peerId: string, peerElo: number, peerName: string, transport?: "webrtc" | "ble") => {
      const isBle = transport === "ble";
      if (isBle && !bleLobbyRoomRef.current) {
        setBleError("BLE disconnected. Reconnect to challenge nearby.");
        return;
      }
      const gameId = uuidv4();
      const room = isBle && bleLobbyRoomRef.current ? bleLobbyRoomRef.current.room : await getLobbyRoom();
      const [sendChallenge] = room.makeAction("challenge");
      setChallengingId(peerId);
      setWaitingForGameId(gameId);
      sendChallenge(
        {
          type: "challenge",
          gameId,
          challengerId: "self",
          challengerName: name.trim() || "Player",
          challengerElo: elo,
          color: "w",
          timestamp: Date.now(),
        },
        peerId
      );
    },
    [name, elo]
  );

  const handleAcceptChallenge = React.useCallback(async () => {
    if (!pendingChallenge) return;
    const isBle = pendingChallengeTransport === "ble";
    if (isBle && !bleLobbyRoomRef.current) {
      clearPendingChallenge();
      setPendingChallengeTransport(null);
      setBleError("BLE connection lost. Challenge expired.");
      return;
    }
    const room = isBle && bleLobbyRoomRef.current ? bleLobbyRoomRef.current.room : await getLobbyRoom();
    const [sendResponse] = room.makeAction("challResp");
    sendResponse(
      { type: "accept", gameId: pendingChallenge.gameId, timestamp: Date.now() },
      pendingChallenge.challengerId
    );
    clearPendingChallenge();
    setPendingChallengeTransport(null);
    const params = new URLSearchParams({
      room: pendingChallenge.gameId,
      color: "b",
      oppElo: String(pendingChallenge.challengerElo),
      oppName: pendingChallenge.challengerName,
    });
    if (isBle && bleLobbyRoomRef.current) {
      storeBleGameRoom(bleLobbyRoomRef.current.room, pendingChallenge.gameId, bleLobbyRoomRef.current.selfPeerId);
      params.set("transport", "ble");
      bleLobbyRoomRef.current = null;
      if (bleHeartbeatTimerRef.current) {
        clearInterval(bleHeartbeatTimerRef.current);
        bleHeartbeatTimerRef.current = null;
      }
    }
    window.location.href = `/game?${params}`;
  }, [pendingChallenge, pendingChallengeTransport, clearPendingChallenge]);

  const handleDeclineChallenge = React.useCallback(async () => {
    if (!pendingChallenge) return;
    const isBle = pendingChallengeTransport === "ble";
    if (isBle && !bleLobbyRoomRef.current) {
      clearPendingChallenge();
      setPendingChallengeTransport(null);
      setBleError("BLE connection lost. Challenge expired.");
      return;
    }
    const room = isBle && bleLobbyRoomRef.current ? bleLobbyRoomRef.current.room : await getLobbyRoom();
    const [sendResponse] = room.makeAction("challResp");
    sendResponse(
      {
        type: "decline",
        gameId: pendingChallenge.gameId,
        timestamp: Date.now(),
      },
      pendingChallenge.challengerId
    );
    clearPendingChallenge();
    setPendingChallengeTransport(null);
  }, [pendingChallenge, pendingChallengeTransport, clearPendingChallenge]);

  const handleCopyLink = React.useCallback(async () => {
    await copyToClipboard(link);
  }, [link]);

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="inline-flex min-h-[44px] min-w-[44px] items-center text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <Link href="/settings" className="inline-flex min-h-[44px] min-w-[44px] items-center text-muted-foreground hover:text-foreground">
            Backup account
          </Link>
        </div>

        {p2pError && (
          <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {p2pError}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lobby</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your ELO: {elo} · Peak: {peakElo}
              {name.trim() ? ` · Playing as ${name.trim()}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                placeholder="e.g. HKTITAN"
                className="max-w-[200px]"
                maxLength={30}
                title="Visible to others in the lobby"
              />
              <span className="text-xs text-muted-foreground">Visible to others in the lobby</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Shareable link</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={link}
                  className="flex-1 font-mono text-sm"
                />
                <Button variant="outline" onClick={handleCopyLink} className="min-h-[44px] min-w-[44px]">
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Nearby (no internet)</p>
              {isBleSupported() ? (
                <>
                  {bleConnected ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">Connected to nearby device</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearBleLobby}
                        className="min-h-[44px] min-w-[44px]"
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={connectBle}
                      disabled={bleConnecting}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      {bleConnecting ? "Connecting…" : "Connect via BLE"}
                    </Button>
                  )}
                  {bleError && (
                    <p className="mt-2 text-sm text-amber-200">{bleError}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  BLE not supported in this browser. Use Chrome or Edge for nearby play.
                </p>
              )}
            </div>

            {waitingForGameId && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-4">
                  <p className="font-medium">
                    Waiting for opponent to accept…
                  </p>
                </CardContent>
              </Card>
            )}

            {pendingChallenge && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-4">
                  <p className="font-medium">
                    {pendingChallenge.challengerName} (ELO {pendingChallenge.challengerElo}) challenges you!
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button onClick={handleAcceptChallenge} className="min-h-[44px] min-w-[44px]">Accept</Button>
                    <Button variant="outline" onClick={handleDeclineChallenge} className="min-h-[44px] min-w-[44px]">
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {showAllPeers ? "Peers (all)" : `Peers (ELO ±${ELO_RANGE})`}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllPeers((v) => !v)}
                  className="min-h-[44px] min-w-[44px]"
                >
                  {showAllPeers ? "Show ELO ±" + ELO_RANGE : "Show all peers"}
                </Button>
              </div>
              {loading ? (
                <p className="text-muted-foreground">Connecting…</p>
              ) : filteredPeers.length === 0 ? (
                <p className="text-muted-foreground">
                  {showAllPeers ? "No peers in lobby yet. Open another tab or share the link." : "No peers in range. Open another tab or share the link."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredPeers.map((peer) => (
                    <li
                      key={peer.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <span className="font-medium">{peer.name}</span>
                        <span className="ml-2 text-muted-foreground">
                          ELO {peer.elo}
                        </span>
                        {peer.transport === "ble" && (
                          <span className="ml-2 text-xs text-muted-foreground">Nearby</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        disabled={challengingId === peer.id}
                        onClick={() =>
                          handleChallenge(peer.id, peer.elo, peer.name, peer.transport)
                        }
                        className="min-h-[44px] min-w-[44px]"
                      >
                        {challengingId === peer.id ? "Challenging…" : "Challenge"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
