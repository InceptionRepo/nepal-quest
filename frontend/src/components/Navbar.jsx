import React, { useState } from 'react';
import { Mountain, Compass, Home, MapPin, Map, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'onboarding', label: 'Plan Trip', icon: MapPin },
  { id: 'dashboard', label: 'Explore Map', icon: Map },
];

export default function Navbar({ onLogoClick, currentView, onNavigate, theme = 'dark', onToggleTheme, onOpenAuth, onOpenRequests }) {
  const { user, isAuthenticated, isGuide, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className={theme === 'dark'
      ? 'sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5'
      : 'sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200'}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <button onClick={onLogoClick} className="flex items-center gap-2 group flex-shrink-0">
            <Mountain className={theme === 'dark' ? 'w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors' : 'w-6 h-6 text-purple-600 group-hover:text-purple-500 transition-colors'} />
            <span className={theme === 'dark' ? 'text-xl font-bold text-white' : 'text-xl font-bold text-slate-900'}>
              Nepal<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">Quest</span>
            </span>
            <Compass className={theme === 'dark' ? 'w-4 h-4 text-gray-500 ml-1' : 'w-4 h-4 text-slate-500 ml-1'} />
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
                      ? theme === 'dark'
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isGuide ? 'bg-green-500/20' : 'bg-purple-500/20'
                  }`}>
                    {isGuide ? (
                      <Shield className={`w-4 h-4 ${isGuide ? 'text-green-400' : 'text-purple-400'}`} />
                    ) : (
                      <User className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl z-20 ${
                      theme === 'dark'
                        ? 'bg-gray-900 border border-white/10'
                        : 'bg-white border border-slate-200'
                    }`}>
                      <div className="p-3 border-b border-white/10">
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {user?.name}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                          {user?.email}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                          isGuide
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {isGuide ? 'Guide' : 'Traveler'}
                        </span>
                      </div>

                      <div className="p-2">
                        {onOpenRequests && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onOpenRequests();
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                              theme === 'dark'
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <MapPin className="w-4 h-4" />
                            {isGuide ? 'Guide Requests' : 'My Requests'}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            Promise.resolve(logout()).finally(() => {
                              if (onNavigate) onNavigate('landing');
                              if (onOpenAuth) onOpenAuth('login');
                            });
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            theme === 'dark'
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Guide signup entry point */}
                <button
                  onClick={() => onOpenAuth && onOpenAuth('register-guide')}
                  className={
                    theme === 'dark'
                      ? 'hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-500/40 text-purple-200 hover:bg-purple-500/10 transition-colors'
                      : 'hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-500/40 text-purple-700 hover:bg-purple-50 transition-colors'
                  }
                >
                  <Shield className="w-4 h-4" />
                  Join as Guide
                </button>

                <button
                  onClick={() => onOpenAuth && onOpenAuth('login')}
                  className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
