import React from 'react';
import { ArrowRight, Code2 } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="py-20 px-6 text-center max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
        <Code2 className="w-3.5 h-3.5" />
        <span>Generated with CodeCraft AI</span>
      </div>
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-100 mb-6">
        Build Faster with{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400">
          Intelligent Agents
        </span>
      </h1>
      <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
        Your new application is ready for customization. Tell the AI assistant what to add, edit, or modify in the chat panel.
      </p>
      <div className="flex items-center justify-center gap-4">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-600/25">
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
