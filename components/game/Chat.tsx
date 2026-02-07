"use client";

/** In-game chat: message list and send input with optional quick emotes. */
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMOTES = ["👋", "👍", "😂", "🤔", "😢", "🔥", "🎉", "♟"];

interface ChatProps {
  messages: Array< { peerId: string; text: string; timestamp: number }>;
  onSend: (text: string) => void;
  opponentName?: string;
}

export function GameChat({ messages, onSend, opponentName }: ChatProps) {
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    const t = input.trim();
    if (t) {
      onSend(t);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-48 border border-border rounded-lg overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 text-sm"
      >
        {messages.map((m, i) => (
          <div key={`${m.timestamp}-${m.peerId}-${i}`} className="break-words">
            <span className="text-muted-foreground font-medium">
              {m.peerId.slice(0, 6)}:
            </span>{" "}
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-1 p-2 border-t border-border flex-wrap">
        {EMOTES.map((e) => (
          <button
            key={e}
            type="button"
            className="w-8 h-8 text-lg hover:bg-muted rounded"
            onClick={() => onSend(e)}
            aria-label={`Send ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex gap-2 p-2 border-t border-border">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 text-sm"
        />
        <Button size="sm" onClick={handleSend}>
          Send
        </Button>
      </div>
    </div>
  );
}
