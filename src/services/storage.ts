import {
  Tour,
  BusLayoutTemplate,
  Hotel,
  Agent,
  Booking,
  SystemSettings,
  Passenger,
  UserSession,
  BookingNotification,
} from '../types';
import {
  INITIAL_BUS_TEMPLATES,
  INITIAL_TOURS,
  INITIAL_HOTELS,
  INITIAL_AGENTS,
  INITIAL_BOOKINGS,
  INITIAL_SETTINGS,
} from '../data/initialData';
import { SupabaseService } from './supabaseService';

const KEYS = {
  TEMPLATES: 'tour_lagbe_bus_templates_v1',
  TOURS: 'tour_lagbe_tours_v1',
  HOTELS: 'tour_lagbe_hotels_v1',
  AGENTS: 'tour_lagbe_agents_v1',
  BOOKINGS: 'tour_lagbe_bookings_v1',
  SETTINGS: 'tour_lagbe_settings_v1',
  AUTH: 'tour_lagbe_auth_v1',
  THEME: 'tour_lagbe_theme_v1',
  NOTIFICATIONS: 'tour_lagbe_notifications_v1',
};

// Safe JSON parser helper
function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading key "${key}" from localStorage:`, err);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Dispatch custom event for cross-component reactivity
    window.dispatchEvent(new Event('tour_lagbe_storage_updated'));
  } catch (err) {
    console.error(`Error writing key "${key}" to localStorage:`, err);
  }
}

export const StorageService = {
  // Initialize data and sync with Supabase
  init: () => {
    // Attempt background sync first
    StorageService.syncFromSupabase();
  },

  // Sync data from Supabase DB to LocalStorage if available
  syncFromSupabase: async () => {
    try {
      const [templates, tours, hotels, agents, bookings, settings] = await Promise.all([
        SupabaseService.fetchTemplates(),
        SupabaseService.fetchTours(),
        SupabaseService.fetchHotels(),
        SupabaseService.fetchAgents(),
        SupabaseService.fetchBookings(),
        SupabaseService.fetchSettings(),
      ]);

      // If Supabase response is non-null (meaning DB query succeeded), override LocalStorage
      if (templates !== null) setStorageItem(KEYS.TEMPLATES, templates);
      if (tours !== null) setStorageItem(KEYS.TOURS, tours);
      if (hotels !== null) setStorageItem(KEYS.HOTELS, hotels);
      if (agents !== null) setStorageItem(KEYS.AGENTS, agents);
      if (bookings !== null) setStorageItem(KEYS.BOOKINGS, bookings);
      if (settings !== null) setStorageItem(KEYS.SETTINGS, settings);

      // Seed initial data ONLY IF database was totally fresh/uninitialized AND LocalStorage is empty
      const hasLocalData = localStorage.getItem(KEYS.TOURS) !== null;
      const isSupabaseEmpty =
        (!tours || tours.length === 0) &&
        (!bookings || bookings.length === 0) &&
        (!agents || agents.length === 0);

      const hasSeededBefore = localStorage.getItem('tour_lagbe_seeded_v2') === 'true';

      if (!hasLocalData && isSupabaseEmpty && !hasSeededBefore) {
        localStorage.setItem('tour_lagbe_seeded_v2', 'true');
        StorageService.resetAll();
      }
    } catch (e) {
      console.warn('Supabase sync error:', e);
    }
  },

  // Reset all data to factory initial state
  resetAll: () => {
    setStorageItem(KEYS.TEMPLATES, INITIAL_BUS_TEMPLATES);
    setStorageItem(KEYS.TOURS, INITIAL_TOURS);
    setStorageItem(KEYS.HOTELS, INITIAL_HOTELS);
    setStorageItem(KEYS.AGENTS, INITIAL_AGENTS);
    setStorageItem(KEYS.BOOKINGS, INITIAL_BOOKINGS);
    setStorageItem(KEYS.SETTINGS, INITIAL_SETTINGS);

    // Also push reset data to Supabase
    SupabaseService.saveTemplates(INITIAL_BUS_TEMPLATES);
    SupabaseService.saveTours(INITIAL_TOURS);
    SupabaseService.saveHotels(INITIAL_HOTELS);
    SupabaseService.saveAgents(INITIAL_AGENTS);
    SupabaseService.saveBookings(INITIAL_BOOKINGS);
    SupabaseService.saveSettings(INITIAL_SETTINGS);
  },

  // Wipe all system data completely (empty state)
  wipeAllData: async (): Promise<void> => {
    setStorageItem(KEYS.TEMPLATES, []);
    setStorageItem(KEYS.TOURS, []);
    setStorageItem(KEYS.HOTELS, []);
    setStorageItem(KEYS.AGENTS, []);
    setStorageItem(KEYS.BOOKINGS, []);
    setStorageItem(KEYS.NOTIFICATIONS, []);
    localStorage.setItem('tour_lagbe_seeded_v2', 'true');

    // Wipe remote Supabase DB records
    await SupabaseService.wipeAllData();
    window.dispatchEvent(new Event('tour_lagbe_storage_updated'));
  },

  // Templates
  getTemplates: (): BusLayoutTemplate[] => getStorageItem(KEYS.TEMPLATES, INITIAL_BUS_TEMPLATES),
  saveTemplates: (templates: BusLayoutTemplate[]) => {
    setStorageItem(KEYS.TEMPLATES, templates);
    SupabaseService.saveTemplates(templates);
  },
  deleteTemplate: (id: string) => {
    const remaining = StorageService.getTemplates().filter((t) => t.id !== id);
    setStorageItem(KEYS.TEMPLATES, remaining);
    SupabaseService.deleteTemplate(id);
  },
  getTemplateById: (id: string): BusLayoutTemplate | undefined =>
    StorageService.getTemplates().find((t) => t.id === id),

  // Tours
  getTours: (): Tour[] => getStorageItem(KEYS.TOURS, INITIAL_TOURS),
  saveTours: (tours: Tour[]) => {
    setStorageItem(KEYS.TOURS, tours);
    SupabaseService.saveTours(tours);
  },
  deleteTour: (id: string) => {
    const remaining = StorageService.getTours().filter((t) => t.id !== id);
    setStorageItem(KEYS.TOURS, remaining);
    SupabaseService.deleteTour(id);
  },
  getTourById: (id: string): Tour | undefined =>
    StorageService.getTours().find((t) => t.id === id),

  // Hotels
  getHotels: (): Hotel[] => getStorageItem(KEYS.HOTELS, INITIAL_HOTELS),
  saveHotels: (hotels: Hotel[]) => {
    setStorageItem(KEYS.HOTELS, hotels);
    SupabaseService.saveHotels(hotels);
  },
  deleteHotel: (id: string) => {
    const remaining = StorageService.getHotels().filter((h) => h.id !== id);
    setStorageItem(KEYS.HOTELS, remaining);
    SupabaseService.deleteHotel(id);
  },
  getHotelById: (id: string): Hotel | undefined =>
    StorageService.getHotels().find((h) => h.id === id),

  // Agents
  getAgents: (): Agent[] => getStorageItem(KEYS.AGENTS, INITIAL_AGENTS),
  saveAgents: (agents: Agent[]) => {
    setStorageItem(KEYS.AGENTS, agents);
    SupabaseService.saveAgents(agents);
  },
  deleteAgent: (id: string) => {
    const remaining = StorageService.getAgents().filter((a) => a.id !== id);
    setStorageItem(KEYS.AGENTS, remaining);
    SupabaseService.deleteAgent(id);
  },
  getAgentById: (id: string): Agent | undefined =>
    StorageService.getAgents().find((a) => a.id === id || a.code === id),

  // Bookings
  getBookings: (): Booking[] => getStorageItem(KEYS.BOOKINGS, INITIAL_BOOKINGS),
  saveBookings: (bookings: Booking[]) => {
    setStorageItem(KEYS.BOOKINGS, bookings);
    SupabaseService.saveBookings(bookings);
  },
  deleteBooking: (id: string) => {
    const remaining = StorageService.getBookings().filter((b) => b.id !== id);
    setStorageItem(KEYS.BOOKINGS, remaining);
    SupabaseService.deleteBooking(id);
  },
  getBookingById: (id: string): Booking | undefined =>
    StorageService.getBookings().find((b) => b.id === id),

  // Get all passengers across all active bookings
  getAllPassengers: (): Passenger[] => {
    const bookings = StorageService.getBookings();
    return bookings
      .filter((b) => b.bookingStatus !== 'Cancelled')
      .flatMap((b) => b.passengers);
  },

  // Settings
  getSettings: (): SystemSettings => getStorageItem(KEYS.SETTINGS, INITIAL_SETTINGS),
  saveSettings: (settings: SystemSettings) => {
    setStorageItem(KEYS.SETTINGS, settings);
    SupabaseService.saveSettings(settings);
  },

  // Auth session
  getAuthSession: (): UserSession | null => getStorageItem<UserSession | null>(KEYS.AUTH, null),
  saveAuthSession: (session: UserSession) => setStorageItem(KEYS.AUTH, session),
  clearAuthSession: () => localStorage.removeItem(KEYS.AUTH),

  // Theme
  getTheme: (): 'dark' | 'light' => {
    const saved = getStorageItem<'dark' | 'light'>(KEYS.THEME, 'dark');
    return saved === 'light' ? 'light' : 'dark';
  },
  saveTheme: (theme: 'dark' | 'light') => setStorageItem(KEYS.THEME, theme),

  // Real-time Notifications
  getNotifications: (): BookingNotification[] =>
    getStorageItem<BookingNotification[]>(KEYS.NOTIFICATIONS, []),
  saveNotifications: (notifications: BookingNotification[]) =>
    setStorageItem(KEYS.NOTIFICATIONS, notifications),
  addNotification: (notification: BookingNotification) => {
    const list = StorageService.getNotifications();
    if (!list.some((n) => n.id === notification.id || (n.bookingId && n.bookingId === notification.bookingId))) {
      const updated = [notification, ...list].slice(0, 50);
      setStorageItem(KEYS.NOTIFICATIONS, updated);
      window.dispatchEvent(new Event('tour_lagbe_notification_added'));
    }
  },
  markNotificationAsRead: (id: string) => {
    const list = StorageService.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setStorageItem(KEYS.NOTIFICATIONS, updated);
    window.dispatchEvent(new Event('tour_lagbe_notification_added'));
  },
  markAllNotificationsAsRead: () => {
    const list = StorageService.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    setStorageItem(KEYS.NOTIFICATIONS, updated);
    window.dispatchEvent(new Event('tour_lagbe_notification_added'));
  },
  clearNotifications: () => {
    setStorageItem(KEYS.NOTIFICATIONS, []);
    window.dispatchEvent(new Event('tour_lagbe_notification_added'));
  },

  // Export full backup
  exportBackup: () => {
    const backup = {
      templates: StorageService.getTemplates(),
      tours: StorageService.getTours(),
      hotels: StorageService.getHotels(),
      agents: StorageService.getAgents(),
      bookings: StorageService.getBookings(),
      settings: StorageService.getSettings(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tour_lagbe_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Import full backup
  importBackup: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.tours && data.bookings) {
        if (data.templates) StorageService.saveTemplates(data.templates);
        if (data.tours) StorageService.saveTours(data.tours);
        if (data.hotels) StorageService.saveHotels(data.hotels);
        if (data.agents) StorageService.saveAgents(data.agents);
        if (data.bookings) StorageService.saveBookings(data.bookings);
        if (data.settings) StorageService.saveSettings(data.settings);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  },
};

