import React from 'react';
import { Sparkles, Github } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-zinc-100 tracking-tight text-lg">
            CodeCraft App
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
            Documentation
          </button>
          <a
            href="#"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
