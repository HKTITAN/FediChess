"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getGameRoom,
  getGameRoomBle,
  leaveRoom,
  clearStoredBleGameRoom,
} from "@/lib/p2p";
import type {
  MovePayload,
  ChatPayload,
  GameEventPayload,
  SyncPayload,
  HistoryPayload,
  HistorySyncPayload,
  GameLogEvent,
  RolePayload,
} from "@/lib/p2p";
import type { Room } from "@/lib/transport-types";
import { validateFen } from "@/lib/chess-engine";
import { getGameStatus } from "@/lib/chess-engine";
import { useUserStore, useGameStore, useUIStore } from "@/lib/store";
import { updateEloAfterGame } from "@/lib/elo";
import { buildPgn, lichessAnalysisUrl } from "@/lib/pgn";
import { copyToClipboard } from "@/lib/clipboard";
import { GameChessBoard } from "@/components/game/ChessBoard";
import { MoveHistory } from "@/components/game/MoveHistory";
import { GameChat } from "@/components/game/Chat";
import { GameTimer } from "@/components/game/Timer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const INITIAL_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function GamePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen p-4">Loading game…</div>}>
      <GameContent />
    </React.Suspense>
  );
}

function GameContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room") ?? "";
  const colorParam = searchParams.get("color") as "w" | "b" | null;
  const spectateParam = searchParams.get("spectate");
  const isSpectator =
    spectateParam === "1" ||
    spectateParam === "true" ||
    (!!roomId && colorParam !== "w" && colorParam !== "b");
  const myColor =
    isSpectator ? null : (colorParam === "w" || colorParam === "b" ? colorParam : "w");
  const oppEloParam = searchParams.get("oppElo");
  const oppNameParam = searchParams.get("oppName");
  const transportParam = searchParams.get("transport");
  const isBleGame = transportParam === "ble";
  const opponentEloFromUrl = oppEloParam ? parseInt(oppEloParam, 10) : null;
  const opponentNameFromUrl = oppNameParam ?? null;

  const { elo, name: myName } = useUserStore();
  const {
    fen,
    myColor: storedColor,
    setGame,
    setFen,
    addMove,
    setResult,
    addChatMessage,
    setDrawOfferFrom,
    resetGame,
    moveHistory,
    gameEventLog,
    setGameEventLog,
    appendGameLogEvent,
    setWhitePeerId,
    setBlackPeerId,
    whitePeerId,
    blackPeerId,
    chatMessages,
    result,
    whiteTimeMs,
    blackTimeMs,
    drawOfferFrom,
    opponentElo,
    opponentName,
  } = useGameStore();
  const { theme: chessTheme } = useUIStore();

  const [showResultDialog, setShowResultDialog] = React.useState(false);
  const [p2pError, setP2pError] = React.useState<string | null>(null);
  const [eloChange, setEloChange] = React.useState<number | null>(null);
  const eloUpdatedRef = React.useRef(false);
  const gameRoomRef = React.useRef<{
    room: Room;
    selfId: string;
  } | null>(null);

  const status = getGameStatus(fen);
  const isMyTurn = storedColor ? status.turn === storedColor : false;
  const isGameOver =
    status.isCheckmate || status.isStalemate || status.isDraw || result;

  React.useEffect(() => {
    if (!roomId) return;
    setGame({
      gameId: roomId,
      roomId: `p2p-chess-${roomId}`,
      fen: INITIAL_FEN,
      myColor,
      opponentId: null,
      opponentName: opponentNameFromUrl,
      opponentElo: opponentEloFromUrl ?? 1200,
    });
  }, [roomId, myColor, opponentNameFromUrl, opponentEloFromUrl, setGame]);

  React.useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    const gameRoomId = `p2p-chess-${roomId}`;

    const run = async () => {
      let room: Room;
      let selfId: string;
      if (isBleGame) {
        const ble = getGameRoomBle(roomId);
        if (!ble) {
          setP2pError("BLE game not found. Start a game from the lobby via Connect via BLE.");
          return;
        }
        room = ble.room;
        selfId = ble.selfPeerId;
      } else {
        try {
          room = (await getGameRoom(roomId)) as unknown as Room;
        } catch (err) {
          if (!mounted) return;
          setP2pError(err instanceof Error ? err.message : "P2P unavailable. Use HTTPS or localhost.");
          return;
        }
        selfId = (await import("trystero/torrent")).selfId;
      }
      gameRoomRef.current = { room, selfId };
      const ourRole: RolePayload = isSpectator
        ? { role: "spectator", peerId: selfId }
        : { role: "player", color: myColor ?? "w", peerId: selfId };
      const [sendMove, getMove] = room.makeAction("move");
      const [sendChat, getChat] = room.makeAction("chat");
      const [sendGameEvent, getGameEvent] = room.makeAction("gameEvent");
      const [sendSync, getSync] = room.makeAction("sync");
      const [sendHistory, getHistory] = room.makeAction("history");
      const [sendHistSync, getHistSync] = room.makeAction("histSync");
      const [sendRole, getRole] = room.makeAction("role");

      getRole((data, peerId) => {
        if (!mounted) return;
        const payload = data as RolePayload | null;
        if (!payload || payload.peerId !== peerId) return;
        if (payload.role === "player" && payload.color === "w") setWhitePeerId(peerId);
        if (payload.role === "player" && payload.color === "b") setBlackPeerId(peerId);
      });

      getMove((data, peerId) => {
        if (!mounted) return;
        const { whitePeerId: w, blackPeerId: b } = useGameStore.getState();
        if (w != null && b != null && peerId !== w && peerId !== b) return;
        const logLen = useGameStore.getState().gameEventLog.length;
        if (logLen > 0) return;
        const payload = data as MovePayload | null;
        if (payload && validateFen(payload.fen)) {
          setFen(payload.fen);
          if (payload.san) addMove(payload.san);
        }
      });

      getChat((data) => {
        if (!mounted) return;
        const payload = data as ChatPayload | null;
        if (payload) addChatMessage(payload.peerId, payload.text);
      });

      getGameEvent((data, peerId) => {
        if (!mounted) return;
        const { whitePeerId: w, blackPeerId: b } = useGameStore.getState();
        if (w != null && b != null && peerId !== w && peerId !== b) return;
        const logLen = useGameStore.getState().gameEventLog.length;
        if (logLen > 0) return;
        const payload = data as GameEventPayload | null;
        if (!payload) return;
        if (payload.type === "resign") {
          const winner = myColor === "w" ? "b" : "w";
          setResult(myColor === winner ? "win" : "loss");
          setShowResultDialog(true);
        } else if (payload.type === "drawOffer") {
          setDrawOfferFrom(peerId);
        } else if (payload.type === "drawAccept") {
          setDrawOfferFrom(null);
          setResult("draw");
          setShowResultDialog(true);
        } else if (payload.type === "drawDecline") {
          setDrawOfferFrom(null);
        }
      });

      getSync((data) => {
        if (!mounted) return;
        const logLen = useGameStore.getState().gameEventLog.length;
        if (logLen > 0) return;
        const payload = data as SyncPayload | null;
        if (payload && validateFen(payload.fen)) setFen(payload.fen);
      });

      getHistory((data) => {
        if (!mounted) return;
        const payload = data as HistoryPayload | null;
        if (!payload || typeof payload.seq !== "number") return;
        const log = useGameStore.getState().gameEventLog;
        if (payload.seq !== log.length + 1) return;
        appendGameLogEvent(payload as GameLogEvent);
        if (
          (payload as GameLogEvent).kind === "resign" ||
          (payload as GameLogEvent).kind === "drawAccept"
        )
          setShowResultDialog(true);
      });

      getHistSync((data) => {
        if (!mounted) return;
        const payload = data as HistorySyncPayload | null;
        if (!payload || !Array.isArray(payload.events)) return;
        if (payload.events.length === 0) return;
        setGameEventLog(payload.events);
        const last = payload.events[payload.events.length - 1];
        if (last.kind === "resign" || last.kind === "drawAccept")
          setShowResultDialog(true);
      });

      const peers = room.getPeers();
      Object.keys(peers).forEach((pid) => {
        (sendRole as (d: unknown, p: string) => void)(ourRole, pid);
      });
      if (!isSpectator && myColor === "w") setWhitePeerId(selfId);
      if (!isSpectator && myColor === "b") setBlackPeerId(selfId);

      room.onPeerJoin((peerId) => {
        if (!mounted) return;
        useGameStore.setState((s) => ({ opponentId: s.opponentId ?? peerId }));
        (sendRole as (d: unknown, p: string) => void)(ourRole, peerId);
        const log = useGameStore.getState().gameEventLog;
        if (myColor === "w") {
          (sendSync as (d: unknown, p: string) => void)(
            { type: "sync", fen: INITIAL_FEN, timestamp: Date.now() },
            peerId
          );
        }
        if (log.length > 0) {
          (sendHistSync as (d: unknown, p: string) => void)(
            { events: log },
            peerId
          );
        }
      });

      room.onPeerLeave(() => {
        if (!mounted) return;
        gameRoomRef.current = null;
        if (isBleGame) clearStoredBleGameRoom();
        if (!isGameOver) {
          setResult("win");
          setShowResultDialog(true);
        }
      });

      return () => {
        mounted = false;
        gameRoomRef.current = null;
        if (isBleGame) {
          clearStoredBleGameRoom();
        } else {
          leaveRoom(gameRoomId);
        }
      };
    };

    run().catch(console.error);

    return () => {
      mounted = false;
      gameRoomRef.current = null;
      if (isBleGame) {
        clearStoredBleGameRoom();
      } else {
        leaveRoom(gameRoomId);
      }
    };
    // Intentionally omit store setters/state: effect must run only when room/identity change; callbacks use getState() for fresh state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myColor, isSpectator, isBleGame, setWhitePeerId, setBlackPeerId]);

  const broadcastHistory = React.useCallback(
    async (event: GameLogEvent) => {
      const current = gameRoomRef.current;
      if (!current) return;
      const { room } = current;
      const [sendHistory] = room.makeAction("history");
      const peers = room.getPeers();
      Object.keys(peers).forEach((pid) => {
        (sendHistory as (d: unknown, p: string) => void)(event, pid);
      });
    },
    []
  );

  const sendMoveToOpponent = React.useCallback(
    async (newFen: string, san?: string) => {
      if (isSpectator) return;
      const current = gameRoomRef.current;
      if (!current) return;
      const { room } = current;
      const [sendMove] = room.makeAction("move");
      const peers = room.getPeers();
      const peerIds = Object.keys(peers);
      const ts = Date.now();
      const nextSeq = useGameStore.getState().gameEventLog.length + 1;
      const historyEvent: GameLogEvent = {
        seq: nextSeq,
        kind: "move",
        fen: newFen,
        san: san ?? "",
        timestamp: ts,
      };
      appendGameLogEvent(historyEvent);
      broadcastHistory(historyEvent);
      if (peerIds.length > 0) {
        const payload: Record<string, unknown> = {
          type: "move",
          fen: newFen,
          san: san ?? "",
          timestamp: ts,
        };
        peerIds.forEach((pid) => {
          (sendMove as (d: unknown, p: string) => void)(payload, pid);
        });
      }
    },
    [appendGameLogEvent, broadcastHistory, isSpectator]
  );

  const handleMove = React.useCallback(
    (newFen: string, san?: string) => {
      if (isSpectator) return;
      setFen(newFen);
      if (san) addMove(san);
      sendMoveToOpponent(newFen, san);

      const st = getGameStatus(newFen);
      if (st.isCheckmate) {
        const winner = st.turn === "w" ? "b" : "w";
        setResult(myColor === winner ? "win" : "loss");
        setShowResultDialog(true);
      } else if (st.isStalemate || st.isDraw) {
        setResult("draw");
        setShowResultDialog(true);
      }
    },
    [setFen, addMove, sendMoveToOpponent, myColor, setResult, isSpectator]
  );

  const handleResign = React.useCallback(async () => {
    if (isSpectator) return;
    const current = gameRoomRef.current;
    if (!current) return;
    const { room } = current;
    const [sendGameEvent] = room.makeAction("gameEvent");
    const peers = room.getPeers();
    const ts = Date.now();
    const nextSeq = useGameStore.getState().gameEventLog.length + 1;
    const historyEvent: GameLogEvent = { seq: nextSeq, kind: "resign", timestamp: ts };
    appendGameLogEvent(historyEvent);
    broadcastHistory(historyEvent);
    Object.keys(peers).forEach((pid) => {
      (sendGameEvent as (d: unknown, p: string) => void)(
        { type: "resign", timestamp: ts },
        pid
      );
    });
    setResult("loss");
    setShowResultDialog(true);
  }, [setResult, appendGameLogEvent, broadcastHistory, isSpectator]);

  const handleDrawOffer = React.useCallback(async () => {
    if (isSpectator) return;
    const current = gameRoomRef.current;
    if (!current) return;
    const { room } = current;
    const [sendGameEvent] = room.makeAction("gameEvent");
    const peers = room.getPeers();
    const ts = Date.now();
    const nextSeq = useGameStore.getState().gameEventLog.length + 1;
    const historyEvent: GameLogEvent = { seq: nextSeq, kind: "drawOffer", timestamp: ts };
    appendGameLogEvent(historyEvent);
    broadcastHistory(historyEvent);
    Object.keys(peers).forEach((pid) => {
      (sendGameEvent as (d: unknown, p: string) => void)(
        { type: "drawOffer", timestamp: ts },
        pid
      );
    });
  }, [appendGameLogEvent, broadcastHistory, isSpectator]);

  const handleAcceptDraw = React.useCallback(async () => {
    if (isSpectator) return;
    const current = gameRoomRef.current;
    if (!current) return;
    const { room } = current;
    const [sendGameEvent] = room.makeAction("gameEvent");
    const peers = room.getPeers();
    const ts = Date.now();
    const nextSeq = useGameStore.getState().gameEventLog.length + 1;
    const historyEvent: GameLogEvent = { seq: nextSeq, kind: "drawAccept", timestamp: ts };
    appendGameLogEvent(historyEvent);
    broadcastHistory(historyEvent);
    Object.keys(peers).forEach((pid) => {
      (sendGameEvent as (d: unknown, p: string) => void)(
        { type: "drawAccept", timestamp: ts },
        pid
      );
    });
    setDrawOfferFrom(null);
    setResult("draw");
    setShowResultDialog(true);
  }, [setResult, setDrawOfferFrom, appendGameLogEvent, broadcastHistory, isSpectator]);

  const handleDeclineDraw = React.useCallback(async () => {
    if (isSpectator) return;
    const current = gameRoomRef.current;
    if (!current) return;
    const { room } = current;
    const [sendGameEvent] = room.makeAction("gameEvent");
    const ts = Date.now();
    const nextSeq = useGameStore.getState().gameEventLog.length + 1;
    const historyEvent: GameLogEvent = { seq: nextSeq, kind: "drawDecline", timestamp: ts };
    appendGameLogEvent(historyEvent);
    broadcastHistory(historyEvent);
    const peers = room.getPeers();
    Object.keys(peers).forEach((pid) => {
      (sendGameEvent as (d: unknown, p: string) => void)(
        { type: "drawDecline", timestamp: ts },
        pid
      );
    });
    setDrawOfferFrom(null);
  }, [setDrawOfferFrom, appendGameLogEvent, broadcastHistory, isSpectator]);

  const handleChatSend = React.useCallback(
    async (text: string) => {
      const current = gameRoomRef.current;
      if (!current) return;
      const { room, selfId } = current;
      const [sendChat] = room.makeAction("chat");
      const peers = room.getPeers();
      Object.keys(peers).forEach((pid) => {
        (sendChat as (d: unknown, p: string) => void)(
          { type: "chat", text, peerId: selfId, timestamp: Date.now() },
          pid
        );
      });
      addChatMessage(selfId, text);
    },
    [addChatMessage]
  );

  const handleTimeUp = React.useCallback(
    (color: "w" | "b") => {
      const loser = color;
      setResult(myColor === loser ? "loss" : "win");
      setShowResultDialog(true);
    },
    [myColor, setResult]
  );

  React.useEffect(() => {
    if (isSpectator || !result || eloUpdatedRef.current) return;
    eloUpdatedRef.current = true;
    const oppElo = opponentElo ?? opponentEloFromUrl ?? 1200;
    updateEloAfterGame(elo, oppElo, result, roomId, fen).then((change) => {
      setEloChange(change.elo - elo);
      useUserStore.setState({ elo: change.elo, peakElo: change.peakElo });
    });
  }, [result, opponentElo, opponentEloFromUrl, elo, roomId, fen, isSpectator]);

  const handleCopyFen = React.useCallback(async () => {
    await copyToClipboard(fen);
  }, [fen]);

  const pgn = React.useMemo(
    () =>
      buildPgn({
        moveHistory,
        result,
        whiteName:
          storedColor === "w"
            ? (myName?.trim() || "White")
            : storedColor === "b"
              ? (opponentName ?? "White")
              : "White",
        blackName:
          storedColor === "b"
            ? (myName?.trim() || "Black")
            : storedColor === "w"
              ? (opponentName ?? "Black")
              : "Black",
      }),
    [moveHistory, result, storedColor, myName, opponentName]
  );

  const handleCopyPgn = React.useCallback(async () => {
    await copyToClipboard(pgn);
  }, [pgn]);

  const lichessUrl = React.useMemo(() => lichessAnalysisUrl(pgn), [pgn]);

  if (!roomId) {
    return (
      <main className="min-h-screen p-4">
        <p>Invalid game. Missing room ID.</p>
        <Link href="/">Go home</Link>
      </main>
    );
  }

  if (p2pError) {
    return (
      <main className="min-h-screen p-4 flex flex-col items-center justify-center gap-4">
        <p className="text-center text-muted-foreground">{p2pError}</p>
        <Link href="/" className="text-primary underline">Go home</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              ← Exit
            </Link>
            {isSpectator && (
              <span className="text-sm text-muted-foreground">Spectating</span>
            )}
            {isBleGame && (
              <span className="text-sm text-muted-foreground">Nearby</span>
            )}
          </div>
          <GameTimer
            whiteTimeMs={whiteTimeMs}
            blackTimeMs={blackTimeMs}
            turn={status.turn}
            onTimeUp={handleTimeUp}
            active={!isGameOver}
          />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex flex-col items-center">
            <GameChessBoard
              fen={fen}
              orientation={storedColor === "w" ? "white" : storedColor === "b" ? "black" : "white"}
              onMove={handleMove}
              disabled={isSpectator || !isMyTurn || !!isGameOver}
              theme={chessTheme}
            />
            {!isSpectator && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleResign} className="min-h-[44px] min-w-[44px]">
                  Resign
                </Button>
                <Button variant="outline" size="sm" onClick={handleDrawOffer} className="min-h-[44px] min-w-[44px]">
                  Offer Draw
                </Button>
                {drawOfferFrom && (
                  <>
                    <Button size="sm" onClick={handleAcceptDraw} className="min-h-[44px] min-w-[44px]">
                      Accept Draw
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeclineDraw} className="min-h-[44px] min-w-[44px]">
                      Decline
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <MoveHistory moves={moveHistory} />
            <GameChat messages={chatMessages} onSend={handleChatSend} />
          </div>
        </div>
      </div>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isSpectator
                ? (result === "draw"
                    ? "Draw"
                    : result === "win"
                      ? "White wins"
                      : result === "loss"
                        ? "Black wins"
                        : gameEventLog.length > 0 && gameEventLog[gameEventLog.length - 1].kind === "resign"
                          ? (getGameStatus(fen).turn === "w" ? "Black wins" : "White wins")
                          : "Game over")
                : result === "win"
                  ? "You Win!"
                  : result === "loss"
                    ? "You Lose"
                    : "Draw"}
            </DialogTitle>
          </DialogHeader>
          <p>
            {!isSpectator && result === "win" && "Congratulations!"}
            {!isSpectator && result === "loss" && "Better luck next time."}
            {(isSpectator || result === "draw") && "The game is a draw."}
          </p>
          {!isSpectator && eloChange != null && eloChange !== 0 && (
            <p className="text-muted-foreground">
              ELO {eloChange > 0 ? "+" : ""}
              {eloChange}
            </p>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyFen} className="min-h-[44px] min-w-[44px]">
              Copy FEN
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyPgn} className="min-h-[44px] min-w-[44px]">
              Copy PGN
            </Button>
            <Button variant="outline" size="sm" asChild className="min-h-[44px] min-w-[44px]">
              <a href={lichessUrl} target="_blank" rel="noopener noreferrer">
                Analyze on Lichess
              </a>
            </Button>
            <Button asChild className="min-h-[44px] min-w-[44px]">
              <Link href="/" onClick={() => { resetGame(); setShowResultDialog(false); }}>
                Back to Home
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
