import React, { useState, useEffect, useRef } from 'react';
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
  Bell,
  X,
  Check,
  Trash2,
  Clock,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { UserSession, BookingNotification } from '../../types';

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

  const [notifications, setNotifications] = useState<BookingNotification[]>(() =>
    StorageService.getNotifications()
  );
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync notifications from Storage and window events
  useEffect(() => {
    const updateNotifs = () => {
      setNotifications(StorageService.getNotifications());
    };

    updateNotifs();
    window.addEventListener('tour_lagbe_notification_added', updateNotifs);
    window.addEventListener('tour_lagbe_storage_updated', updateNotifs);

    return () => {
      window.removeEventListener('tour_lagbe_notification_added', updateNotifs);
      window.removeEventListener('tour_lagbe_storage_updated', updateNotifs);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    StorageService.markNotificationAsRead(id);
  };

  const handleMarkAllRead = () => {
    StorageService.markAllNotificationsAsRead();
  };

  const handleClearAll = () => {
    StorageService.clearNotifications();
  };

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
            {/* Realtime Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-xl border transition-all relative ${
                  isNotifOpen
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="রিয়েল-টাইম নোটিফিকেশন (Realtime Bookings)"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-rose-500/50">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs text-white">রিয়েল-টাইম বুকিং নোটিফিকেশন</span>
                      {unreadCount > 0 && (
                        <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                          {unreadCount} নতুন
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <>
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                            title="সব রিড করুন"
                          >
                            <Check className="w-3 h-3" />
                            <span>সব পড়া হয়েছে</span>
                          </button>
                          <button
                            onClick={handleClearAll}
                            className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setIsNotifOpen(false)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 space-y-2">
                        <Bell className="w-8 h-8 mx-auto opacity-30" />
                        <p className="text-xs">কোনো নোটিফিকেশন নেই</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 ${
                            notif.isRead
                              ? 'bg-slate-900/60 opacity-75'
                              : 'bg-emerald-950/20 border-l-4 border-l-emerald-500'
                          } hover:bg-slate-800/60`}
                        >
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                            <Ticket className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate">
                                {notif.customerName}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-extrabold shrink-0">
                                ৳{notif.totalAmount.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 truncate">
                              সিট: <span className="font-bold text-emerald-300">{notif.seats.join(', ')}</span>
                              {notif.tourName ? ` • ${notif.tourName}` : ''}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                              <span>এজেন্ট: {notif.agentName}</span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(notif.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
