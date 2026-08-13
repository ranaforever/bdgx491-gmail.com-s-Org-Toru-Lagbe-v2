import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Bus,
  BookmarkCheck,
  Building2,
  BedDouble,
  Users,
  Printer,
  FileSpreadsheet,
  Settings,
  AlertCircle,
  Database,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unassignedCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  role?: 'admin' | 'agent';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unassignedCount,
  isOpenMobile,
  setIsOpenMobile,
  role = 'admin',
}) => {
  const allMenuItems = [
    { id: 'public-booking', label: 'বাস সিট বুকিং গ্যালারি', icon: Bus, isPublic: true },
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'tours', label: 'ট্যুর ম্যানেজমেন্ট', icon: Compass, adminOnly: true },
    { id: 'bus-layouts', label: 'বাস সিট লেআউট বিল্ডার', icon: Bus, badge: 'NEW', adminOnly: true },
    { id: 'bookings', label: 'বুকিং লিস্ট ও পেমেন্ট', icon: BookmarkCheck },
    { id: 'hotels', label: 'হোটেল তথ্য', icon: Building2 },
    {
      id: 'room-assignments',
      label: 'প্যাসেঞ্জার রুম অ্যাসাইনমেন্ট',
      icon: BedDouble,
      countBadge: unassignedCount > 0 ? unassignedCount : undefined,
    },
    { id: 'agents', label: 'এজেন্ট ও বুকার', icon: Users, adminOnly: true },
    { id: 'ticket-designer', label: 'টিকিট ও টোকেন সাইজ', icon: Printer, adminOnly: true },
    { id: 'reports', label: 'এজেন্ট ও রুম রিপোর্ট', icon: FileSpreadsheet, adminOnly: true },
    { id: 'settings', label: 'সিস্টেম সেটিংস & ব্যাকআপ', icon: Settings, adminOnly: true },
  ];

  const menuItems = role === 'agent'
    ? allMenuItems.filter((item) => !item.adminOnly)
    : allMenuItems.filter((item) => item.id !== 'public-booking');

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 lg:w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-sm text-white uppercase tracking-wider">
            এডমিন কন্ট্রোল সেন্টার
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}

              {item.countBadge !== undefined && (
                <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  {item.countBadge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
        <p>Tour লাগবে © 2026</p>
        <p className="mt-0.5 text-slate-400">All data saved locally & safely</p>
      </div>
    </aside>
    </>
  );
};
