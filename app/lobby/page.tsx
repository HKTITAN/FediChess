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
} from "@/lib/p2p";
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
  const [link, setLink] = React.useState("");
  const [challengingId, setChallengingId] = React.useState<string | null>(null);

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
      const room = await getLobbyRoom();
      const [sendHeartbeat, getHeartbeat] = room.makeAction("heartbeat");
      const [sendChallenge, getChallenge] = room.makeAction("challenge");
      const [sendChallengeResponse, getChallengeResponse] =
        room.makeAction("challengeResponse");

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
          });
      });

      getChallenge((data: unknown, peerId: string) => {
        const d = data as ChallengePayload;
        if (!mounted || !d) return;
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
          name,
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

  const filteredPeers = React.useMemo(() => {
    return peers
      .filter((p) => Math.abs(p.elo - elo) <= ELO_RANGE)
      .slice(0, MAX_PEERS_DISPLAYED);
  }, [peers, elo]);

  const [waitingForGameId, setWaitingForGameId] = React.useState<string | null>(
    null
  );

  const handleChallenge = React.useCallback(
    async (peerId: string, peerElo: number, peerName: string) => {
      const gameId = uuidv4();
      const room = await getLobbyRoom();
      const [sendChallenge] = room.makeAction("challenge");
      setChallengingId(peerId);
      setWaitingForGameId(gameId);
      sendChallenge(
        {
          type: "challenge",
          gameId,
          challengerId: "self",
          challengerName: name,
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
    const room = await getLobbyRoom();
    const [sendResponse] = room.makeAction("challengeResponse");
    sendResponse(
      { type: "accept", gameId: pendingChallenge.gameId, timestamp: Date.now() },
      pendingChallenge.challengerId
    );
    clearPendingChallenge();
    const params = new URLSearchParams({
      room: pendingChallenge.gameId,
      color: "b",
      oppElo: String(pendingChallenge.challengerElo),
      oppName: pendingChallenge.challengerName,
    });
    window.location.href = `/game?${params}`;
  }, [pendingChallenge, clearPendingChallenge]);

  const handleDeclineChallenge = React.useCallback(async () => {
    if (!pendingChallenge) return;
    const room = await getLobbyRoom();
    const [sendResponse] = room.makeAction("challengeResponse");
    sendResponse(
      {
        type: "decline",
        gameId: pendingChallenge.gameId,
        timestamp: Date.now(),
      },
      pendingChallenge.challengerId
    );
    clearPendingChallenge();
  }, [pendingChallenge, clearPendingChallenge]);

  const handleCopyLink = React.useCallback(() => {
    navigator.clipboard.writeText(link);
  }, [link]);

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lobby</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your ELO: {elo} · Peak: {peakElo}
            </p>
            <div className="flex gap-2 pt-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="max-w-[200px]"
              />
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
                <Button variant="outline" onClick={handleCopyLink}>
                  Copy
                </Button>
              </div>
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
                    <Button onClick={handleAcceptChallenge}>Accept</Button>
                    <Button variant="outline" onClick={handleDeclineChallenge}>
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <p className="mb-2 text-sm font-medium">
                Peers (ELO ±{ELO_RANGE})
              </p>
              {loading ? (
                <p className="text-muted-foreground">Connecting…</p>
              ) : filteredPeers.length === 0 ? (
                <p className="text-muted-foreground">
                  No peers in range. Open another tab or share the link.
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
                      </div>
                      <Button
                        size="sm"
                        disabled={challengingId === peer.id}
                        onClick={() =>
                          handleChallenge(peer.id, peer.elo, peer.name)
                        }
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
