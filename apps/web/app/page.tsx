'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Terminal,
  Zap,
  Github,
  CheckCircle2,
  Code2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

const EXAMPLE_PROMPTS = [
  '📊 SaaS Analytics Dashboard with metrics charts, user table, and dark theme',
  '🛍️ Modern E-Commerce Store with product filter grid, cart drawer, and checkout',
  '📋 Kanban Task Management Board with column drag-and-drop and tag badges',
  '🤖 AI Chat Assistant UI with streaming bubbles, sidebar history, and markdown renderer',
];

const TEMPLATES = [
  {
    name: 'Next.js & Tailwind Starter',
    description: 'Clean responsive boilerplate with Lucide icons and Vite HMR',
    tag: 'Recommended',
    template: 'nextjs',
  },
  {
    name: 'Blank Canvas',
    description: 'Empty isolated project workspace for custom architectures',
    tag: 'Minimal',
    template: 'blank',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    // Check if system is initialized
    apiFetch<{ hasSuperuser: boolean; isInitialized: boolean }>('/api/auth/status')
      .then((status) => {
        if (!status.hasSuperuser && !status.isInitialized) {
          router.push('/onboarding');
        } else {
          setOnboardingChecked(true);
        }
      })
      .catch(() => {
        setOnboardingChecked(true);
      });
  }, [router]);

  const handleStartPrompt = async (selectedPrompt?: string) => {
    const finalPrompt = selectedPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setLoading(true);
    try {
      const res = await apiFetch<{ project: { id: string } }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: finalPrompt.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'My Generated App',
          template: 'nextjs',
        }),
      });

      // Save initial prompt in sessionStorage to auto-run in workspace
      sessionStorage.setItem(`initial_prompt_${res.project.id}`, finalPrompt);
      router.push(`/projects/${res.project.id}`);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!onboardingChecked) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-purple-500 selection:text-white flex flex-col relative overflow-hidden">
      {/* Background Neon Ambient Lighting */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400">
              CodeCraft
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
              Self-Hosted V1
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-zinc-900 transition-colors"
            >
              Dashboard
            </button>
            <a
              href="https://github.com/codecraft-ai/codecraft"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-20 pb-24 w-full flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 mb-8 shadow-sm backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Open-Source Autonomous Full-Stack AI Coding Assistant</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.1] mb-6">
          Idea to interactive web app{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400">
            in seconds.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mb-12 leading-relaxed">
          Describe any feature or full application in natural language. CodeCraft plans, generates, runs, and self-corrects inside secure, isolated Docker containers.
        </p>

        {/* Interactive Hero Prompt Bar */}
        <div className="w-full max-w-2xl relative mb-8 group">
          <div className="glass-panel p-2.5 rounded-2xl glow-purple transition-all border border-purple-500/20 focus-within:border-purple-500/50">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleStartPrompt();
                }
              }}
              placeholder="Describe what you want to build (e.g., A sleek crypto portfolio dashboard with price trend charts and currency converter)..."
              className="w-full bg-transparent border-none focus:outline-none resize-none px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 leading-relaxed"
            />
            <div className="flex items-center justify-between pt-2 px-2 border-t border-zinc-800/60">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Code2 className="w-3.5 h-3.5" />
                <span>Next.js + Tailwind + TypeScript</span>
              </div>
              <button
                disabled={!prompt.trim() || loading}
                onClick={() => handleStartPrompt()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs text-white shadow-lg shadow-purple-600/25 transition-all"
              >
                <span>{loading ? 'Creating App...' : 'Generate App'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Example Prompt Suggestion Pills */}
        <div className="w-full max-w-2xl flex flex-wrap items-center justify-center gap-2 mb-20">
          <span className="text-xs text-zinc-500 mr-1">Try asking for:</span>
          {EXAMPLE_PROMPTS.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(ex);
                handleStartPrompt(ex);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all text-left"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Features Highlight Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-20">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Isolated Docker Sandbox</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every build and command runs inside resource-limited Docker containers with memory and process quotas.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Instant Hot Reload</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Vite dev server synchronizes code modifications in real time, rendering live component updates in the iframe.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4 text-pink-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Git Checkpoint History</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every prompt automatically generates a Git commit checkpoint with visual diffs and one-click rollback.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-600">
        CodeCraft — Self-Hostable Open-Source AI Application Builder
      </footer>
    </div>
  );
}