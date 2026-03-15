import React from 'react';
import { Mountain, Compass } from 'lucide-react';

export default function Navbar({ onLogoClick }) {
  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <button onClick={onLogoClick} className="flex items-center gap-2 group">
            <Mountain className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="text-xl font-bold text-white">
              Nepal<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-300">Quest</span>
            </span>
            <Compass className="w-4 h-4 text-gray-500 ml-1" />
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs bg-purple-500/10 text-purple-300 font-semibold px-3 py-1 rounded-full border border-purple-500/20">
              AI Hackathon 2026
            </span>
            <span className="text-lg" role="img" aria-label="Nepal flag">🇳🇵</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
