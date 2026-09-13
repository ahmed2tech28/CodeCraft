'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, Cpu, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic' | 'openrouter' | 'ollama'>('openai');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; message?: string; error?: string }>('/api/system/test-ai', {
        method: 'POST',
        body: JSON.stringify({
          provider: aiProvider,
          model: aiModel,
          apiKey: apiKey || undefined,
          baseUrl: baseUrl || undefined,
        }),
      });

      if (res.success) {
        setTestStatus('success');
        setTestMessage('Connection verified successfully!');
      } else {
        setTestStatus('error');
        setTestMessage(res.error || 'Connection failed');
      }
    } catch (err: unknown) {
      setTestStatus('error');
      setTestMessage((err as Error).message);
    }
  };

  const handleCompleteSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ success: boolean; session: { token: string } }>('/api/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          aiProvider,
          aiModel,
          apiKey: apiKey || undefined,
          baseUrl: baseUrl || undefined,
        }),
      });

      if (res.session?.token) {
        localStorage.setItem('codecraft_token', res.session.token);
      }

      setStep(3);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Neon Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-xl shadow-purple-500/20 mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Welcome to CodeCraft</h1>
          <p className="text-sm text-zinc-400 mt-2">Self-Hosted AI App Builder Setup Wizard</p>
        </div>

        {/* Wizard Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl relative">
          {/* Step Progress Pills */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800/80">
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? 'text-purple-400' : 'text-zinc-500'}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center bg-purple-500/20 border border-purple-500/30">1</span>
              <span>Super User</span>
            </div>
            <div className="w-12 h-[1px] bg-zinc-800" />
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? 'text-purple-400' : 'text-zinc-500'}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center bg-purple-500/20 border border-purple-500/30">2</span>
              <span>AI Provider</span>
            </div>
            <div className="w-12 h-[1px] bg-zinc-800" />
            <div className={`flex items-center gap-2 text-xs font-semibold ${step === 3 ? 'text-purple-400' : 'text-zinc-500'}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center bg-purple-500/20 border border-purple-500/30">3</span>
              <span>Launch</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Super User Account Creation */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-4 text-purple-400 font-medium text-sm">
                <Shield className="w-4 h-4" />
                <span>Create Administrator Account</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                As the instance owner, your account will be granted full administrative privileges over all projects and sandbox runners.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Admin Developer"
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@codecraft.local"
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <button
                disabled={!name || !email || password.length < 6}
                onClick={() => setStep(2)}
                className="w-full mt-8 py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/25"
              >
                <span>Continue to AI Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: AI Provider Setup */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4 text-purple-400 font-medium text-sm">
                <Cpu className="w-4 h-4" />
                <span>Configure AI Model Provider</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Choose the model provider for your autonomous coding agents. You can change this later in settings.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Provider</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => {
                      const p = e.target.value as 'openai' | 'anthropic' | 'openrouter' | 'ollama';
                      setAiProvider(p);
                      if (p === 'openai') setAiModel('gpt-4o-mini');
                      else if (p === 'anthropic') setAiModel('claude-3-5-sonnet-latest');
                      else if (p === 'openrouter') setAiModel('anthropic/claude-3.5-sonnet');
                      else if (p === 'ollama') setAiModel('qwen2.5-coder:latest');
                    }}
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100"
                  >
                    <option value="openai">OpenAI (GPT-4o, GPT-4o Mini)</option>
                    <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                    <option value="openrouter">OpenRouter (DeepSeek, Llama, Gemini)</option>
                    <option value="ollama">Local Ollama (Offline / Private)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Model Name</label>
                  <input
                    type="text"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100"
                  />
                </div>

                {aiProvider !== 'ollama' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>
                )}

                {aiProvider === 'ollama' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Ollama Base URL</label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434/v1"
                      className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="text-xs font-medium text-zinc-400 hover:text-zinc-200 underline disabled:opacity-50"
                  >
                    {testStatus === 'testing' ? 'Testing Connection...' : 'Test Connection'}
                  </button>
                  {testStatus === 'success' && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{testMessage}</span>
                    </span>
                  )}
                  {testStatus === 'error' && (
                    <span className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{testMessage}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-medium text-sm text-zinc-300 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleCompleteSetup}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 font-medium text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/25"
                >
                  <span>{loading ? 'Finalizing Setup...' : 'Finish Setup & Launch'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Setup Success & Redirect */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-zinc-100 mb-2">Instance Initialized Successfully!</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-8 leading-relaxed">
                Super user account created and AI provider configuration registered. You are ready to start building applications.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 font-medium text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/25"
              >
                <span>Enter CodeCraft Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
