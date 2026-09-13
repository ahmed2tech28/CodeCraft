'use client';

import React from 'react';
import { X, GitCommit, FileDiff } from 'lucide-react';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitHash: string;
  commitMessage: string;
  diffContent: string;
  onRollback: () => void;
  rollingBack: boolean;
}

export function DiffModal({
  isOpen,
  onClose,
  commitHash,
  commitMessage,
  diffContent,
  onRollback,
  rollingBack,
}: DiffModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <FileDiff className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Checkpoint Diff</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 font-mono text-[10px] text-zinc-400">
                  {commitHash.slice(0, 7)}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 truncate max-w-lg mt-0.5">{commitMessage}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRollback}
              disabled={rollingBack}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all"
            >
              {rollingBack ? 'Reverting...' : 'Revert to this Checkpoint'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Diff content body */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-950 font-mono text-xs text-zinc-300">
          {diffContent ? (
            <pre className="whitespace-pre-wrap leading-relaxed">
              {diffContent.split('\n').map((line, idx) => {
                let lineClass = 'text-zinc-400';
                if (line.startsWith('+') && !line.startsWith('+++')) lineClass = 'text-emerald-400 bg-emerald-950/30';
                else if (line.startsWith('-') && !line.startsWith('---')) lineClass = 'text-rose-400 bg-rose-950/30';
                else if (line.startsWith('@@')) lineClass = 'text-purple-400 bg-purple-950/20';
                return (
                  <div key={idx} className={`px-2 py-0.5 rounded ${lineClass}`}>
                    {line}
                  </div>
                );
              })}
            </pre>
          ) : (
            <div className="text-center py-12 text-zinc-500">No diff changes found for this commit.</div>
          )}
        </div>
      </div>
    </div>
  );
}
