'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  FolderCode,
  Calendar,
  Settings,
  CheckCircle2,
  AlertCircle,
  Zap,
  Gift,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { Project, ProviderConfig } from '@codecraft/shared';
import { SUPPORTED_MODELS } from '@codecraft/shared';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTemplate, setNewProjectTemplate] = useState<'nextjs' | 'blank'>('nextjs');
  const [creating, setCreating] = useState(false);

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsProvider, setSettingsProvider] = useState<'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'gemini'>('openrouter');
  const [settingsModel, setSettingsModel] = useState('google/gemma-4-31b-it:free');
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const [settingsBaseUrl, setSettingsBaseUrl] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsTestStatus, setSettingsTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [settingsTestMsg, setSettingsTestMsg] = useState<string | null>(null);
  const [currentConfig, setCurrentConfig] = useState<ProviderConfig | null>(null);

  const loadProjects = async () => {
    try {
      const res = await apiFetch<{ projects: Project[] }>('/api/projects');
      setProjects(res.projects);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentConfig = async () => {
    try {
      const res = await apiFetch<{ config: ProviderConfig | null }>('/api/system/provider-config');
      if (res.config) {
        setCurrentConfig(res.config);
        setSettingsProvider(res.config.provider);
        setSettingsModel(res.config.model);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadProjects();
    loadCurrentConfig();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const res = await apiFetch<{ project: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjectName.trim(),
          template: newProjectTemplate,
        }),
      });

      setShowCreateModal(false);
      setNewProjectName('');
      router.push(`/projects/${res.project.id}`);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleTestConnection = async () => {
    setSettingsTestStatus('testing');
    setSettingsTestMsg(null);
    try {
      const res = await apiFetch<{ success: boolean; message?: string; error?: string }>('/api/system/test-ai', {
        method: 'POST',
        body: JSON.stringify({
          provider: settingsProvider,
          model: settingsModel,
          apiKey: settingsApiKey || undefined,
          baseUrl: settingsBaseUrl || undefined,
        }),
      });
      if (res.success) {
        setSettingsTestStatus('success');
        setSettingsTestMsg(res.message || 'Connection verified!');
      } else {
        setSettingsTestStatus('error');
        setSettingsTestMsg(res.error || 'Connection failed');
      }
    } catch (err: unknown) {
      setSettingsTestStatus('error');
      setSettingsTestMsg((err as Error).message);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await apiFetch('/api/system/provider-config', {
        method: 'POST',
        body: JSON.stringify({
          provider: settingsProvider,
          model: settingsModel,
          apiKey: settingsApiKey || undefined,
          baseUrl: settingsBaseUrl || undefined,
        }),
      });
      await loadCurrentConfig();
      setShowSettings(false);
      setSettingsApiKey('');
      setSettingsTestStatus('idle');
      setSettingsTestMsg(null);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setSettingsSaving(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentProviderConfig = SUPPORTED_MODELS[settingsProvider];

  const getApiKeyLabel = () => {
    if (settingsProvider === 'openrouter') return 'OpenRouter API Key (openrouter.ai/keys)';
    if (settingsProvider === 'gemini') return 'Gemini API Key (aistudio.google.com/app/apikey)';
    return 'API Key';
  };

  const getApiKeyPlaceholder = () => {
    if (settingsProvider === 'openrouter') return 'sk-or-v1-...';
    if (settingsProvider === 'gemini') return 'AIza...';
    return 'sk-...';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-zinc-100">CodeCraft</span>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Provider Badge */}
            {currentConfig && (
              <button
                onClick={() => setShowSettings(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-mono">{currentConfig.provider}/{currentConfig.model.split('/').pop()}</span>
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
              title="AI Provider Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 font-medium text-xs text-white shadow-lg shadow-purple-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Projects</h1>
            <p className="text-xs text-zinc-400 mt-1">Manage and launch your generated applications</p>
          </div>

          {/* Search bar */}
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-zinc-500">Loading workspaces...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
              <FolderCode className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-zinc-200 text-base mb-1">No Projects Found</h3>
            <p className="text-xs text-zinc-400 mb-6">Create your first AI-generated web app to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 font-medium text-xs text-white shadow-lg shadow-purple-600/20"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="glass-panel p-5 rounded-xl hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                      {project.status.toUpperCase()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id, project.name);
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-zinc-100 text-base mb-1 group-hover:text-purple-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono mb-4 truncate">{project.slug}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="text-purple-400 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Open IDE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-zinc-800">
            <h2 className="text-lg font-bold text-zinc-100 mb-1">Create New Project</h2>
            <p className="text-xs text-zinc-400 mb-6">Initialize a fresh isolated workspace.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Crypto Dashboard"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Template</label>
                <select
                  value={newProjectTemplate}
                  onChange={(e) => setNewProjectTemplate(e.target.value as 'nextjs' | 'blank')}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="nextjs">Next.js + Tailwind + TypeScript Starter (Recommended)</option>
                  <option value="blank">Blank Workspace</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProjectName.trim()}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create & Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Provider Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-zinc-100">AI Provider Settings</h2>
              <button
                onClick={() => { setShowSettings(false); setSettingsTestStatus('idle'); setSettingsTestMsg(null); setSettingsApiKey(''); }}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-6">Update your AI provider or API key at any time.</p>

            <div className="space-y-4">
              {/* Provider */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Provider</label>
                <select
                  value={settingsProvider}
                  onChange={(e) => {
                    const p = e.target.value as typeof settingsProvider;
                    setSettingsProvider(p);
                    setSettingsModel(SUPPORTED_MODELS[p]?.defaultModel || '');
                    setSettingsTestStatus('idle');
                    setSettingsTestMsg(null);
                  }}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100"
                >
                  <option value="openrouter">OpenRouter (Free Models &amp; All Frontier Models)</option>
                  <option value="gemini">Google Gemini (gemini-2.5-pro, gemini-2.0-flash…)</option>
                  <option value="openai">OpenAI (GPT-4o, GPT-4o Mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="ollama">Local Ollama (Offline / Private)</option>
                </select>
              </div>

              {/* Model */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-300">Model</label>
                  {settingsProvider === 'openrouter' && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Gift className="w-3 h-3" /> Free models available
                    </span>
                  )}
                  {settingsProvider === 'gemini' && (
                    <span className="text-[10px] text-blue-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Free quota available
                    </span>
                  )}
                </div>
                <select
                  value={settingsModel}
                  onChange={(e) => setSettingsModel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100"
                >
                  {currentProviderConfig?.modelOptions
                    ? currentProviderConfig.modelOptions.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))
                    : currentProviderConfig?.models.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                </select>
              </div>

              {/* API Key */}
              {settingsProvider !== 'ollama' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    {getApiKeyLabel()}
                  </label>
                  <input
                    type="password"
                    value={settingsApiKey}
                    onChange={(e) => setSettingsApiKey(e.target.value)}
                    placeholder={
                      currentConfig?.provider === settingsProvider
                        ? '••••••••• (leave blank to keep existing key)'
                        : getApiKeyPlaceholder()
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600"
                  />
                  {settingsProvider === 'gemini' && (
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Get a free key at{' '}
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                        aistudio.google.com
                      </a>
                    </p>
                  )}
                  {settingsProvider === 'openrouter' && (
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Free models require a free account key from{' '}
                      <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">
                        openrouter.ai/keys
                      </a>
                    </p>
                  )}
                </div>
              )}

              {/* Ollama base URL */}
              {settingsProvider === 'ollama' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Ollama Base URL</label>
                  <input
                    type="text"
                    value={settingsBaseUrl}
                    onChange={(e) => setSettingsBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
              )}

              {/* Test connection */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={settingsTestStatus === 'testing'}
                  className="text-xs font-medium text-zinc-400 hover:text-zinc-200 underline disabled:opacity-50"
                >
                  {settingsTestStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
                {settingsTestStatus === 'success' && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {settingsTestMsg}
                  </span>
                )}
                {settingsTestStatus === 'error' && (
                  <span className="text-xs text-rose-400 flex items-center gap-1 max-w-[60%] truncate">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {settingsTestMsg}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => { setShowSettings(false); setSettingsTestStatus('idle'); setSettingsTestMsg(null); setSettingsApiKey(''); }}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                {settingsSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
