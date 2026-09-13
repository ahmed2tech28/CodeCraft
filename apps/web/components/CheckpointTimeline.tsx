'use client';

import React from 'react';
import { History, GitCommit, ArrowLeftRight, RotateCcw, Clock } from 'lucide-react';

export interface Checkpoint {
  hash: string;
  date: string;
  message: string;
  author: string;
}

interface CheckpointTimelineProps {
  checkpoints: Checkpoint[];
  onSelectDiff: (checkpoint: Checkpoint) => void;
  onRollback: (checkpoint: Checkpoint) => void;
  rollingBackHash: string | null;
}

export function CheckpointTimeline({
  checkpoints,
  onSelectDiff,
  onRollback,
  rollingBackHash,
}: CheckpointTimelineProps) {
  if (checkpoints.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-zinc-500">
        <History className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <span>No checkpoints recorded yet.</span>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 px-1">
        <span className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-purple-400" />
          <span>REVISION HISTORY</span>
        </span>
        <span className="text-[10px] text-zinc-500">{checkpoints.length} checkpoints</span>
      </div>

      <div className="relative border-l border-zinc-800 ml-2.5 space-y-4 pt-1">
        {checkpoints.map((cp, idx) => {
          const isLatest = idx === 0;
          return (
            <div key={cp.hash} className="relative pl-5 group">
              {/* Bullet icon */}
              <span
                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full flex items-center justify-center ${
                  isLatest ? 'bg-purple-600 text-white ring-4 ring-purple-950' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <GitCommit className="w-2.5 h-2.5" />
              </span>

              {/* Checkpoint Item card */}
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 group-hover:border-zinc-700 transition-all text-xs">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-mono text-[10px] text-purple-400 font-semibold">{cp.hash.slice(0, 7)}</span>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(cp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-zinc-200 text-[11px] leading-snug line-clamp-2 mb-2">{cp.message}</p>

                <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/50">
                  <button
                    onClick={() => onSelectDiff(cp)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-[10px] font-medium transition-colors"
                  >
                    <ArrowLeftRight className="w-3 h-3 text-zinc-400" />
                    <span>View Diff</span>
                  </button>

                  {!isLatest && (
                    <button
                      onClick={() => onRollback(cp)}
                      disabled={rollingBackHash === cp.hash}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-medium transition-colors ml-auto"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{rollingBackHash === cp.hash ? 'Reverting...' : 'Revert'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
