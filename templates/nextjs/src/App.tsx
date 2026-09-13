import React from 'react';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { Features } from './components/Features.tsx';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        Powered by CodeCraft AI App Builder
      </footer>
    </div>
  );
};

export default App;
