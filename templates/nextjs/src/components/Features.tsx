import React from 'react';
import { Zap, Shield, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant Live Reload',
    description: 'Vite dev server provides ultra-fast Hot Module Replacement as the AI codes.',
  },
  {
    icon: Shield,
    title: 'Isolated Sandbox',
    description: 'Code execution and builds run inside dedicated, resource-limited Docker containers.',
  },
  {
    icon: Sparkles,
    title: 'Full Customization',
    description: 'Ask the AI to change styles, add database schemas, components, or interactive pages.',
  },
];

export const Features: React.FC = () => {
  return (
    <section className="py-12 px-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
