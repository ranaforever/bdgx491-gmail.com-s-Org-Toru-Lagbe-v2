import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { PublicBookingFlow } from './components/booking/PublicBookingFlow';
import { Dashboard } from './components/admin/Dashboard';
import { TourManager } from './components/admin/TourManager';
import { BusLayoutBuilder } from './components/admin/BusLayoutBuilder';
import { BookingManager } from './components/admin/BookingManager';
import { HotelManager } from './components/admin/HotelManager';
import { RoomAssignment } from './components/admin/RoomAssignment';
import { AgentManager } from './components/admin/AgentManager';
import { TicketTokenDesigner } from './components/admin/TicketTokenDesigner';
import { ReportsManager } from './components/admin/ReportsManager';
import { SettingsManager } from './components/admin/SettingsManager';
import { PrintableTicket } from './components/print/PrintableTicket';
import { LoginForm } from './components/auth/LoginForm';
import { StorageService } from './services/storage';
import { RealtimeService } from './services/realtimeService';
import { CalculationUtils } from './utils/calculations';
import { Booking, UserSession } from './types';
import { ToastProvider } from './context/ToastContext';
import { Menu, X } from 'lucide-react';

const tabMetaMap: Record<string, { label: string }> = {
  'public-booking': { label: 'বাস সিট বুকিং গ্যালারি' },
  'dashboard': { label: 'ড্যাশবোর্ড' },
  'tours': { label: 'ট্যুর ম্যানেজমেন্ট' },
  'bus-layouts': { label: 'বাস সিট লেআউট বিল্ডার' },
  'bookings': { label: 'বুকিং লিস্ট ও পেমেন্ট' },
  'hotels': { label: 'হোটেল তথ্য' },
  'room-assignments': { label: 'প্যাসেঞ্জার রুম অ্যাসাইনমেন্ট' },
  'agents': { label: 'এজেন্ট ও বুকার' },
  'ticket-designer': { label: 'টিকিট ও টোকেন প্রিন্ট প্যানেল' },
  'reports': { label: 'এজেন্ট ও রুম রিপোর্ট' },
  'settings': { label: 'সিস্টেম সেটিংস & ব্যাকআপ' },
};

function MainAppContent() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => StorageService.getTheme());
  const [dataVersion, setDataVersion] = useState(0);

  // Apply theme to document element whenever theme changes
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  // Storage sync and event listener for dynamic updates
  useEffect(() => {
    StorageService.init();

    // Subscribe to global Supabase Realtime changes for bookings
    const unsubscribeGlobalRealtime = RealtimeService.initGlobalBookingsSubscription(() => {
      StorageService.syncFromSupabase();
    });

    const handleStorageUpdate = () => {
      setDataVersion((v) => v + 1);
    };

    window.addEventListener('tour_lagbe_storage_updated', handleStorageUpdate);

    // Sync from Supabase on focus or every 20s
    const sync = () => StorageService.syncFromSupabase();
    const interval = setInterval(sync, 20000);
    window.addEventListener('focus', sync);

    return () => {
      unsubscribeGlobalRealtime();
      window.removeEventListener('tour_lagbe_storage_updated', handleStorageUpdate);
      clearInterval(interval);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    StorageService.saveTheme(nextTheme);
  };

  // Initialize auth session on mount
  useEffect(() => {
    const existingSession = StorageService.getAuthSession();
    setSession(existingSession);
    setIsAuthLoaded(true);
  }, []);

  const [activeMode, setActiveMode] = useState<'public' | 'admin'>('public');
  const [activeAdminTab, setActiveAdminTab] = useState<string>('public-booking');
  const [openTabs, setOpenTabs] = useState<string[]>(['public-booking']);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<Booking | null>(null);

  const handleSelectTab = (tabId: string) => {
    if (!openTabs.includes(tabId)) {
      setOpenTabs((prev) => [...prev, tabId]);
    }
    setActiveAdminTab(tabId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabIdToClose: string) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter((t) => t !== tabIdToClose);
    if (nextTabs.length === 0) {
      setOpenTabs(['public-booking']);
      setActiveAdminTab('public-booking');
    } else {
      setOpenTabs(nextTabs);
      if (activeAdminTab === tabIdToClose) {
        setActiveAdminTab(nextTabs[nextTabs.length - 1]);
      }
    }
  };

  // Unassigned passengers badge count calculation
  const hotels = StorageService.getHotels();
  const bookings = StorageService.getBookings();
  const tours = StorageService.getTours();
  const activeTourId = tours[0]?.id || '';
  const hotelStats = CalculationUtils.getHotelSummaryStats(hotels, bookings, activeTourId);
  const unassignedCount = hotelStats.unassignedCount;

  const handleViewTicket = (booking: Booking) => {
    setSelectedBookingForPrint(booking);
  };

  const handleLogout = () => {
    StorageService.clearAuthSession();
    setSession(null);
    setActiveMode('public');
  };

  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-bold text-sm">
        লোড হচ্ছে...
      </div>
    );
  }

  // Gate app behind Agent Code / Admin Login
  if (!session) {
    return <LoginForm onLoginSuccess={(sess) => setSession(sess)} />;
  }

  const isAdmin = session.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        activeAdminTab={activeAdminTab}
        setActiveAdminTab={setActiveAdminTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        unassignedCount={unassignedCount}
        session={session}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Layout for both Admin & Agent */}
        <Sidebar
          activeTab={activeAdminTab}
          setActiveTab={setActiveAdminTab}
          unassignedCount={unassignedCount}
          isOpenMobile={isMobileSidebarOpen}
          setIsOpenMobile={setIsMobileSidebarOpen}
          role={session.role}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-8">
          {/* Mobile App Section Header */}
          <div className="lg:hidden flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {tabMetaMap[activeAdminTab]?.label || activeAdminTab}
              </span>
            </div>

            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/30 transition-all"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>সকল মেনু</span>
            </button>
          </div>

          {/* Dynamic Tab Views */}
          {activeAdminTab === 'public-booking' && (
            <PublicBookingFlow
              onViewTicket={handleViewTicket}
              onBookingComplete={() => {}}
              session={session}
            />
          )}
          {activeAdminTab === 'dashboard' && <Dashboard setActiveTab={setActiveAdminTab} />}
          {activeAdminTab === 'tours' && <TourManager />}
          {activeAdminTab === 'bus-layouts' && <BusLayoutBuilder />}
          {activeAdminTab === 'bookings' && <BookingManager onViewTicket={handleViewTicket} session={session} />}
          {activeAdminTab === 'hotels' && <HotelManager session={session} />}
          {activeAdminTab === 'room-assignments' && <RoomAssignment session={session} />}
          {activeAdminTab === 'agents' && <AgentManager />}
          {activeAdminTab === 'ticket-designer' && <TicketTokenDesigner />}
          {activeAdminTab === 'reports' && <ReportsManager />}
          {activeAdminTab === 'settings' && <SettingsManager />}
        </main>
      </div>

      {/* Mobile App Bottom Tab Navigation */}
      <MobileBottomNav
        activeTab={activeAdminTab}
        setActiveTab={setActiveAdminTab}
        unassignedCount={unassignedCount}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
        role={session.role}
      />

      {/* Printable Ticket Modal */}
      {selectedBookingForPrint && (
        <PrintableTicket
          booking={selectedBookingForPrint}
          onClose={() => setSelectedBookingForPrint(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
