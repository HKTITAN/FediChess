"use client";

import * as React from "react";

interface MoveHistoryProps {
  moves: string[];
  className?: string;
}

export function MoveHistory({ moves, className = "" }: MoveHistoryProps) {
  const pairs = React.useMemo(() => {
    const result: [string?, string?][] = [];
    for (let i = 0; i < moves.length; i += 2) {
      result.push([moves[i], moves[i + 1]]);
    }
    return result;
  }, [moves]);

  return (
    <div className={`overflow-y-auto max-h-48 ${className}`}>
      <p className="text-sm font-medium mb-2">Moves</p>
      <div className="space-y-1 text-sm">
        {pairs.map(([w, b], i) => (
          <div key={i} className="flex gap-4">
            <span className="text-muted-foreground w-6">{i + 1}.</span>
            <span className="w-16">{w ?? "-"}</span>
            <span className="w-16">{b ?? "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
