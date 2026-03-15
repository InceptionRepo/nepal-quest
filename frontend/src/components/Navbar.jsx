import React from 'react';
import { Mountain, Compass, Home, MapPin, Map, Landmark } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'onboarding', label: 'Plan Trip', icon: MapPin },
  { id: 'dashboard', label: 'Explore Map', icon: Map },
  { id: 'heritage', label: 'Heritage', icon: Landmark },
];

export default function Navbar({ onLogoClick, currentView, onNavigate }) {
  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <button onClick={onLogoClick} className="flex items-center gap-2 group flex-shrink-0">
            <Mountain className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="text-xl font-bold text-white">
              Nepal<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-300">Quest</span>
            </span>
            <Compass className="w-4 h-4 text-gray-500 ml-1" />
          </button>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = currentView === id || (id === 'dashboard' && currentView === 'dashboard');
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3" />
        </div>
      </div>
    </nav>
  );
}
