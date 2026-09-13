'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  Play,
  Square,
  RefreshCw,
  Folder,
  FileCode,
  File,
  ChevronRight,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
  Send,
  ArrowLeft,
  Terminal,
  Code2,
  Eye,
  History,
  Files,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { apiFetch } from '../../../lib/api';
import { FileNode, Project, Message, AgentStepEvent } from '@codecraft/shared';
import { CheckpointTimeline, Checkpoint } from '../../../components/CheckpointTimeline';
import { DiffModal } from '../../../components/DiffModal';

// Dynamically import Monaco Editor to avoid SSR errors
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  // Workspace state
  const [project, setProject] = useState<Project | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string>('src/App.tsx');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileSaving, setFileSaving] = useState(false);
  const [leftTab, setLeftTab] = useState<'files' | 'history'>('files');
  const [centerTab, setCenterTab] = useState<'editor' | 'preview'>('preview');

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStarting, setPreviewStarting] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);

  // Checkpoints & Diff state
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [activeDiff, setActiveDiff] = useState<{
    isOpen: boolean;
    commitHash: string;
    commitMessage: string;
    diffContent: string;
  }>({
    isOpen: false,
    commitHash: '',
    commitMessage: '',
    diffContent: '',
  });
  const [rollingBackHash, setRollingBackHash] = useState<string | null>(null);

  // Chat & Agent state
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentStepEvent[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // File tree expanded folder set
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['src', 'src/components']));

  // Load project & files
  const loadWorkspace = async () => {
    try {
      const projRes = await apiFetch<{ project: Project; preview: { previewUrl: string | null } }>(
        `/api/projects/${projectId}`
      );
      setProject(projRes.project);
      if (projRes.preview?.previewUrl) {
        setPreviewUrl(projRes.preview.previewUrl);
      }

      const filesRes = await apiFetch<{ files: FileNode[] }>(`/api/projects/${projectId}/files`);
      setFileTree(filesRes.files);

      const msgsRes = await apiFetch<{ messages: Message[] }>(`/api/projects/${projectId}/agent/messages`);
      setMessages(msgsRes.messages);

      await loadCheckpoints();
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Load checkpoints history
  const loadCheckpoints = async () => {
    try {
      const res = await apiFetch<{ checkpoints: Checkpoint[] }>(`/api/projects/${projectId}/checkpoints`);
      setCheckpoints(res.checkpoints);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Load active file content
  const loadFile = async (path: string) => {
    try {
      const res = await apiFetch<{ content: string }>(`/api/projects/${projectId}/file?path=${encodeURIComponent(path)}`);
      setActiveFile(path);
      setFileContent(res.content);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Save active file content
  const handleSaveFile = async (newVal?: string) => {
    const contentToSave = newVal !== undefined ? newVal : fileContent;
    setFileSaving(true);
    try {
      await apiFetch(`/api/projects/${projectId}/file`, {
        method: 'PUT',
        body: JSON.stringify({ path: activeFile, content: contentToSave }),
      });
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setFileSaving(false);
    }
  };

  // View diff for a checkpoint
  const handleSelectDiff = async (cp: Checkpoint) => {
    try {
      const res = await apiFetch<{ diff: string }>(`/api/projects/${projectId}/checkpoints/${cp.hash}/diff`);
      setActiveDiff({
        isOpen: true,
        commitHash: cp.hash,
        commitMessage: cp.message,
        diffContent: res.diff,
      });
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Rollback to checkpoint
  const handleRollback = async (cp: Checkpoint) => {
    if (!confirm(`Are you sure you want to revert to checkpoint "${cp.message}"? Unsaved changes will be lost.`)) {
      return;
    }

    setRollingBackHash(cp.hash);
    try {
      await apiFetch(`/api/projects/${projectId}/checkpoints/rollback`, {
        method: 'POST',
        body: JSON.stringify({ hash: cp.hash }),
      });
      setActiveDiff((prev) => ({ ...prev, isOpen: false }));
      await loadWorkspace();
      if (activeFile) loadFile(activeFile);
      setPreviewKey((k) => k + 1);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setRollingBackHash(null);
    }
  };

  // Start live preview
  const handleTogglePreview = async () => {
    if (previewUrl) {
      await apiFetch(`/api/projects/${projectId}/preview/stop`, { method: 'POST' });
      setPreviewUrl(null);
    } else {
      setPreviewStarting(true);
      try {
        const res = await apiFetch<{ preview: { previewUrl: string } }>(
          `/api/projects/${projectId}/preview/start`,
          { method: 'POST' }
        );
        setPreviewUrl(res.preview.previewUrl);
        setCenterTab('preview');
      } catch (err: unknown) {
        alert((err as Error).message);
      } finally {
        setPreviewStarting(false);
      }
    }
  };

  // Send prompt to AI Agent
  const handleSendPrompt = async (promptToSend?: string) => {
    const text = promptToSend || prompt;
    if (!text.trim() || agentRunning) return;

    setPrompt('');
    setAgentRunning(true);
    setAgentLogs([]);

    // Optimistic user message in chat
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      conversationId: 'default',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await apiFetch<{ success: boolean; result: { summary: string } }>(
        `/api/projects/${projectId}/agent/run`,
        {
          method: 'POST',
          body: JSON.stringify({ prompt: text }),
        }
      );

      // Refresh file tree, checkpoints & preview
      await loadWorkspace();
      if (activeFile) loadFile(activeFile);
      setPreviewKey((k) => k + 1);

      // Add assistant response to messages
      const tempAiMsg: Message = {
        id: 'ai-' + Date.now(),
        conversationId: 'default',
        role: 'assistant',
        content: res.result.summary,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempAiMsg]);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setAgentRunning(false);
    }
  };

  // Setup Server-Sent Events (SSE) listener for live agent logs
  useEffect(() => {
    if (!projectId) return;

    const eventSource = new EventSource(`http://localhost:3001/api/projects/${projectId}/agent/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data: AgentStepEvent = JSON.parse(event.data);
        if (data.type === 'connected') return;

        setAgentLogs((prev) => [...prev, data]);

        if (data.type === 'file_change') {
          loadWorkspace();
        }
      } catch {
        // Ignore parse error
      }
    };

    return () => {
      eventSource.close();
    };
  }, [projectId]);

  // Initial load & trigger initial prompt from landing page if set
  useEffect(() => {
    loadWorkspace();
    loadFile('src/App.tsx');

    const initialPrompt = sessionStorage.getItem(`initial_prompt_${projectId}`);
    if (initialPrompt) {
      sessionStorage.removeItem(`initial_prompt_${projectId}`);
      handleSendPrompt(initialPrompt);
    }
  }, [projectId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentLogs]);

  const toggleFolder = (dirPath: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  };

  // Render File Tree recursively
  const renderTree = (nodes: FileNode[]) => {
    return (
      <ul className="space-y-0.5 text-xs">
        {nodes.map((node) => {
          if (node.isDirectory) {
            const isExpanded = expandedDirs.has(node.path);
            return (
              <li key={node.path}>
                <div
                  onClick={() => toggleFolder(node.path)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-800/60 cursor-pointer text-zinc-400 hover:text-zinc-200"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <Folder className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate">{node.name}</span>
                </div>
                {isExpanded && node.children && <div className="pl-4">{renderTree(node.children)}</div>}
              </li>
            );
          }

          const isActive = activeFile === node.path;
          return (
            <li key={node.path}>
              <div
                onClick={() => {
                  loadFile(node.path);
                  setCenterTab('editor');
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 font-medium border-l-2 border-purple-500'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                {node.name.endsWith('.tsx') || node.name.endsWith('.ts') ? (
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <File className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span className="truncate">{node.name}</span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden font-sans">
      {/* Diff Modal */}
      <DiffModal
        isOpen={activeDiff.isOpen}
        onClose={() => setActiveDiff((prev) => ({ ...prev, isOpen: false }))}
        commitHash={activeDiff.commitHash}
        commitMessage={activeDiff.commitMessage}
        diffContent={activeDiff.diffContent}
        onRollback={() => {
          const targetCp = checkpoints.find((c) => c.hash === activeDiff.commitHash);
          if (targetCp) handleRollback(targetCp);
        }}
        rollingBack={rollingBackHash === activeDiff.commitHash}
      />

      {/* Top Navbar */}
      <header className="h-12 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-zinc-100 truncate max-w-xs">
              {project?.name || 'Loading...'}
            </span>
          </div>
        </div>

        {/* Center Mode Controls */}
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setCenterTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              centerTab === 'preview' ? 'bg-zinc-800 text-purple-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setCenterTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              centerTab === 'editor' ? 'bg-zinc-800 text-purple-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Editor</span>
          </button>
        </div>

        {/* Right Preview Controls */}
        <div className="flex items-center gap-2">
          {previewUrl && centerTab === 'preview' && (
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 mr-2">
              <button
                onClick={() => setViewport('desktop')}
                className={`p-1 rounded ${viewport === 'desktop' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-500'}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                className={`p-1 rounded ${viewport === 'tablet' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-500'}`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`p-1 rounded ${viewport === 'mobile' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-500'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handleTogglePreview}
            disabled={previewStarting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              previewUrl
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            {previewStarting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : previewUrl ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{previewStarting ? 'Starting...' : previewUrl ? 'Stop Preview' : 'Run Preview'}</span>
          </button>
        </div>
      </header>

      {/* 3-Pane Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANE 1: Left File Explorer / History Tabs (260px) */}
        <aside className="w-64 border-r border-zinc-800 bg-zinc-950/80 flex flex-col shrink-0">
          <div className="h-9 px-2 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/30">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLeftTab('files')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  leftTab === 'files' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Files className="w-3.5 h-3.5" />
                <span>Files</span>
              </button>
              <button
                onClick={() => setLeftTab('history')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  leftTab === 'history' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>
            </div>
            <button
              onClick={loadWorkspace}
              title="Refresh"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {leftTab === 'files' ? (
              <div className="p-2">{renderTree(fileTree)}</div>
            ) : (
              <CheckpointTimeline
                checkpoints={checkpoints}
                onSelectDiff={handleSelectDiff}
                onRollback={handleRollback}
                rollingBackHash={rollingBackHash}
              />
            )}
          </div>
        </aside>

        {/* PANE 2: Center (Editor or Live Preview) */}
        <main className="flex-1 flex flex-col bg-zinc-900/30 overflow-hidden relative">
          {centerTab === 'editor' ? (
            <div className="flex-1 flex flex-col">
              {/* File tab header */}
              <div className="h-9 px-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono text-zinc-300">{activeFile}</span>
                <span className="text-[11px] text-zinc-500">{fileSaving ? 'Saving...' : 'Auto-saved'}</span>
              </div>
              <div className="flex-1">
                <MonacoEditor
                  height="100%"
                  theme="vs-dark"
                  path={activeFile}
                  defaultLanguage={
                    activeFile.endsWith('.tsx') || activeFile.endsWith('.ts')
                      ? 'typescript'
                      : activeFile.endsWith('.css')
                        ? 'css'
                        : activeFile.endsWith('.json')
                          ? 'json'
                          : 'html'
                  }
                  value={fileContent}
                  onChange={(val) => {
                    setFileContent(val || '');
                    handleSaveFile(val || '');
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-zinc-950/50">
              {previewUrl ? (
                <div
                  className={`h-full bg-white rounded-xl shadow-2xl border border-zinc-800 overflow-hidden transition-all duration-300 ${
                    viewport === 'desktop'
                      ? 'w-full'
                      : viewport === 'tablet'
                        ? 'w-[768px]'
                        : 'w-[375px]'
                  }`}
                >
                  <iframe
                    key={previewKey}
                    src={previewUrl}
                    title="CodeCraft Preview"
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                <div className="text-center p-8 max-w-sm glass-panel rounded-2xl">
                  <Play className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-zinc-100 mb-1">Live Preview Idle</h3>
                  <p className="text-xs text-zinc-400 mb-6">
                    Start the preview container to render live changes instantly in the workspace.
                  </p>
                  <button
                    onClick={handleTogglePreview}
                    disabled={previewStarting}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 font-medium text-xs text-white shadow-lg shadow-purple-600/20"
                  >
                    {previewStarting ? 'Starting Preview...' : 'Launch Live Preview'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* PANE 3: Right AI Chat & Live Logs (380px) */}
        <aside className="w-96 border-l border-zinc-800 bg-zinc-950/90 flex flex-col shrink-0">
          <div className="h-9 px-4 border-b border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-zinc-400">
            <div className="flex items-center gap-1.5 text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI CODING ASSISTANT</span>
            </div>
            {agentRunning && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>ACTIVE</span>
              </span>
            )}
          </div>

          {/* Messages & Logs Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'glass-panel text-zinc-200 border border-zinc-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {/* Live Agent Step Activity Log */}
            {agentLogs.length > 0 && agentRunning && (
              <div className="glass-panel rounded-xl p-3 border border-purple-500/30 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[11px]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>AGENT ACTIVITY</span>
                </div>
                {agentLogs.slice(-4).map((log, idx) => (
                  <div key={idx} className="font-mono text-[11px] text-zinc-400 flex items-start gap-1.5 truncate">
                    <span className="text-purple-400 shrink-0">›</span>
                    <span className="truncate">{log.text || log.toolName || log.filePath || log.type}</span>
                  </div>
                ))}
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Prompt Box */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-950">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="relative"
            >
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                disabled={agentRunning}
                placeholder="Ask CodeCraft to build, modify, or debug features..."
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || agentRunning}
                className="absolute right-2.5 bottom-3.5 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white transition-all shadow-md shadow-purple-600/20"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
