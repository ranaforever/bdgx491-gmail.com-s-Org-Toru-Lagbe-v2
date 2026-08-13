import React from 'react';
import {
  Bus,
  LayoutDashboard,
  Compass,
  BedDouble,
  BookmarkCheck,
  Menu,
  AlertCircle,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unassignedCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  role?: 'admin' | 'agent';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  unassignedCount,
  isOpenMobile,
  setIsOpenMobile,
  role = 'admin',
}) => {
  const tabs = [
    {
      id: 'public-booking',
      label: 'বুকিং',
      icon: Bus,
    },
    {
      id: 'dashboard',
      label: 'ড্যাশবোর্ড',
      icon: LayoutDashboard,
    },
    {
      id: 'tours',
      label: 'ট্যুর',
      icon: Compass,
      adminOnly: true,
    },
    {
      id: 'room-assignments',
      label: 'রুম',
      icon: BedDouble,
      badge: unassignedCount > 0 ? unassignedCount : undefined,
    },
    {
      id: 'bookings',
      label: 'লিস্ট',
      icon: BookmarkCheck,
    },
  ];

  const visibleTabs = role === 'agent'
    ? tabs.filter((t) => !t.adminOnly)
    : tabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 py-1.5 px-1 flex justify-around items-center lg:hidden shadow-[0_-8px_25px_rgba(0,0,0,0.5)] active-touch-highlight">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setIsOpenMobile(false);
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 min-w-[56px] min-h-[44px] ${
              isActive
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200 active:scale-95'
            }`}
          >
            {/* Active Pill Indicator */}
            {isActive && (
              <span className="absolute -top-1.5 w-6 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]" />
            )}

            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              {tab.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {tab.badge}
                </span>
              )}
            </div>

            <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-black text-emerald-400' : 'font-semibold text-slate-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* More / Menu Drawer Toggle Button */}
      <button
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 min-w-[56px] min-h-[44px] ${
          isOpenMobile
            ? 'text-emerald-400 font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200 active:scale-95'
        }`}
      >
        <Menu className={`w-5 h-5 ${isOpenMobile ? 'stroke-[2.5px]' : 'stroke-2'}`} />
        <span className={`text-[10px] mt-1 tracking-tight ${isOpenMobile ? 'font-black text-emerald-400' : 'font-semibold text-slate-400'}`}>
          মেনু
        </span>
      </button>
    </div>
  );
};
