'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Play,
  FolderCode,
  Calendar,
  Layers,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { Project } from '@codecraft/shared';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTemplate, setNewProjectTemplate] = useState<'nextjs' | 'blank'>('nextjs');
  const [creating, setCreating] = useState(false);

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

  useEffect(() => {
    loadProjects();
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

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 font-medium text-xs text-white shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
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
    </div>
  );
}
