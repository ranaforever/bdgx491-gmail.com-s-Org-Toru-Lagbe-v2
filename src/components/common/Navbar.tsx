import React from 'react';
import {
  Bus,
  Search,
  Shield,
  Ticket,
  UserCheck,
  AlertCircle,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { UserSession } from '../../types';

interface NavbarProps {
  activeMode: 'public' | 'admin';
  setActiveMode: (mode: 'public' | 'admin') => void;
  activeAdminTab: string;
  setActiveAdminTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  unassignedCount: number;
  session: UserSession | null;
  onLogout: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMode,
  setActiveMode,
  activeAdminTab,
  setActiveAdminTab,
  searchQuery,
  setSearchQuery,
  unassignedCount,
  session,
  onLogout,
  theme,
  toggleTheme,
}) => {
  const settings = StorageService.getSettings();
  const isAdmin = session?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur text-white shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-2.5 cursor-pointer shrink-0" onClick={() => setActiveMode('public')}>
            <img
              src="/logo.svg"
              alt="Tour লাগবে Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white font-sans">
                  {settings.businessName}
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-xs mx-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সার্চ করুন (নাম, ফোন, বুকিং ID, সিট)..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Right Session & Action controls */}
          <div className="flex items-center space-x-2">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl transition-all"
              title={theme === 'dark' ? 'হোয়াইট/লাইটিং মোড (Light Mode)' : 'ডার্ক মোড (Dark Mode)'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Session Info Badge */}
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs">
              {isAdmin ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">মাস্টার</span> এডমিন
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>এজেন্ট:</span>
                  <span className="bg-emerald-500 text-slate-950 px-2 py-0.2 rounded font-black text-[11px]">
                    {session?.agentName || session?.agencyName || session?.agentCode}
                  </span>
                </div>
              )}
            </div>

            {/* Admin mode toggle - only visible for master admin */}
            {isAdmin && (
              <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setActiveMode('public')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeMode === 'public'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">বুকিং</span>
                </button>

                <button
                  onClick={() => setActiveMode('admin')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeMode === 'admin'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">এডমিন</span>
                </button>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl transition-all"
              title="লগআউট করুন"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
