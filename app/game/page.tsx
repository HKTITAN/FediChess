"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getGameRoom,
  leaveRoom,
} from "@/lib/p2p";
import type { MovePayload, ChatPayload, GameEventPayload, SyncPayload } from "@/lib/p2p";
import { validateFen } from "@/lib/chess-engine";
import { getGameStatus } from "@/lib/chess-engine";
import { useUserStore, useGameStore, useUIStore } from "@/lib/store";
import { updateEloAfterGame } from "@/lib/elo";
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
  const myColor = colorParam === "w" || colorParam === "b" ? colorParam : "w";
  const oppEloParam = searchParams.get("oppElo");
  const oppNameParam = searchParams.get("oppName");
  const opponentEloFromUrl = oppEloParam ? parseInt(oppEloParam, 10) : null;
  const opponentNameFromUrl = oppNameParam ?? null;

  const { elo } = useUserStore();
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
    chatMessages,
    result,
    whiteTimeMs,
    blackTimeMs,
    drawOfferFrom,
    opponentElo,
  } = useGameStore();
  const { theme: chessTheme } = useUIStore();

  const [showResultDialog, setShowResultDialog] = React.useState(false);
  const [eloChange, setEloChange] = React.useState<number | null>(null);
  const eloUpdatedRef = React.useRef(false);

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
      const room = await getGameRoom(roomId);
      const [sendMove, getMove] = room.makeAction("move");
      const [sendChat, getChat] = room.makeAction("chat");
      const [sendGameEvent, getGameEvent] = room.makeAction("gameEvent");
      const [sendSync, getSync] = room.makeAction("sync");

      getMove((data, peerId) => {
        if (!mounted) return;
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
        const payload = data as SyncPayload | null;
        if (payload && validateFen(payload.fen)) setFen(payload.fen);
      });

      room.onPeerJoin((peerId) => {
        if (!mounted) return;
        useGameStore.setState({ opponentId: peerId });
        if (myColor === "w") {
          (sendSync as (d: unknown, p: string) => void)(
            { type: "sync", fen: INITIAL_FEN, timestamp: Date.now() },
            peerId
          );
        }
      });

      room.onPeerLeave(() => {
        if (!mounted) return;
        if (!isGameOver) {
          setResult("win");
          setShowResultDialog(true);
        }
      });

      return () => {
        mounted = false;
        leaveRoom(gameRoomId);
      };
    };

    run().catch(console.error);

    return () => {
      mounted = false;
      leaveRoom(gameRoomId);
    };
  }, [roomId, myColor]);

  const sendMoveToOpponent = React.useCallback(
    async (newFen: string, san?: string) => {
      const room = await getGameRoom(roomId);
      const [sendMove] = room.makeAction("move");
      const peers = room.getPeers();
      const peerIds = Object.keys(peers);
      if (peerIds.length > 0) {
        const payload: Record<string, unknown> = {
          type: "move",
          fen: newFen,
          san: san ?? "",
          timestamp: Date.now(),
        };
        (sendMove as (d: unknown, p: string) => void)(payload, peerIds[0]);
      }
    },
    [roomId]
  );

  const handleMove = React.useCallback(
    (newFen: string, san?: string) => {
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
    [setFen, addMove, sendMoveToOpponent, myColor, setResult]
  );

  const handleResign = React.useCallback(async () => {
    const room = await getGameRoom(roomId);
    const [sendGameEvent] = room.makeAction("gameEvent");
    const peers = room.getPeers();
    Object.keys(peers).forEach((pid) => {
      (sendGameEvent as (d: unknown, p: string) => void)(
        { type: "resign", timestamp: Date.now() },
        pid
      );
    });
    setResult("loss");
    setShowResultDialog(true);
  }, [roomId, setResult]);

  const handleDrawOffer = React.useCallback(async () => {
    const room = await getGameRoom(roomId);
    const [sendGameEvent] = room.makeAction("gameEvent");
    const peers = room.getPeers();
    Object.keys(peers).forEach((pid) => {
      (sendGameEvent as (d: unknown, p: string) => void)(
        { type: "drawOffer", timestamp: Date.now() },
        pid
      );
    });
  }, [roomId]);

  const handleAcceptDraw = React.useCallback(async () => {
    const room = await getGameRoom(roomId);
    const [sendGameEvent] = room.makeAction("gameEvent");
    const peers = room.getPeers();
    Object.keys(peers).forEach((pid) => {
      (sendGameEvent as (d: unknown, p: string) => void)(
        { type: "drawAccept", timestamp: Date.now() },
        pid
      );
    });
    setDrawOfferFrom(null);
    setResult("draw");
    setShowResultDialog(true);
  }, [roomId, setResult, setDrawOfferFrom]);

  const handleDeclineDraw = React.useCallback(async () => {
    const room = await getGameRoom(roomId);
    const [sendGameEvent] = room.makeAction("gameEvent");
    if (drawOfferFrom) {
      (sendGameEvent as (d: unknown, p: string) => void)(
        { type: "drawDecline", timestamp: Date.now() },
        drawOfferFrom
      );
    }
    setDrawOfferFrom(null);
  }, [roomId, drawOfferFrom, setDrawOfferFrom]);

  const handleChatSend = React.useCallback(
    async (text: string) => {
      const room = await getGameRoom(roomId);
      const [sendChat] = room.makeAction("chat");
      const peers = room.getPeers();
      const selfId = (await import("trystero/torrent")).selfId;
      Object.keys(peers).forEach((pid) => {
        (sendChat as (d: unknown, p: string) => void)(
          { type: "chat", text, peerId: selfId, timestamp: Date.now() },
          pid
        );
      });
      addChatMessage(selfId, text);
    },
    [roomId, addChatMessage]
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
    if (!result || eloUpdatedRef.current) return;
    eloUpdatedRef.current = true;
    const oppElo = opponentElo ?? opponentEloFromUrl ?? 1200;
    updateEloAfterGame(elo, oppElo, result, roomId, fen).then((change) => {
      setEloChange(change.elo - elo);
      useUserStore.setState({ elo: change.elo, peakElo: change.peakElo });
    });
  }, [result, opponentElo, opponentEloFromUrl, elo, roomId, fen]);

  const handleCopyFen = React.useCallback(() => {
    navigator.clipboard.writeText(fen);
  }, [fen]);

  if (!roomId) {
    return (
      <main className="min-h-screen p-4">
        <p>Invalid game. Missing room ID.</p>
        <Link href="/">Go home</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← Exit
          </Link>
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
              orientation={myColor === "w" ? "white" : "black"}
              onMove={handleMove}
              disabled={!isMyTurn || !!isGameOver}
              theme={chessTheme}
            />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResign}>
                Resign
              </Button>
              <Button variant="outline" size="sm" onClick={handleDrawOffer}>
                Offer Draw
              </Button>
              {drawOfferFrom && (
                <>
                  <Button size="sm" onClick={handleAcceptDraw}>
                    Accept Draw
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeclineDraw}>
                    Decline
                  </Button>
                </>
              )}
            </div>
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
              {result === "win"
                ? "You Win!"
                : result === "loss"
                  ? "You Lose"
                  : "Draw"}
            </DialogTitle>
          </DialogHeader>
          <p>
            {result === "win" && "Congratulations!"}
            {result === "loss" && "Better luck next time."}
            {result === "draw" && "The game is a draw."}
          </p>
          {eloChange != null && eloChange !== 0 && (
            <p className="text-muted-foreground">
              ELO {eloChange > 0 ? "+" : ""}
              {eloChange}
            </p>
          )}
          <DialogFooter>
            <Button onClick={handleCopyFen}>Copy FEN</Button>
            <Button asChild>
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
