import {
  Tour,
  BusLayoutTemplate,
  Hotel,
  Agent,
  Booking,
  SystemSettings,
  Passenger,
  UserSession,
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
  // Initialize default data if empty & pull latest from Supabase if available
  init: () => {
    if (!localStorage.getItem(KEYS.TEMPLATES)) {
      setStorageItem(KEYS.TEMPLATES, INITIAL_BUS_TEMPLATES);
    }
    if (!localStorage.getItem(KEYS.TOURS)) {
      setStorageItem(KEYS.TOURS, INITIAL_TOURS);
    }
    if (!localStorage.getItem(KEYS.HOTELS)) {
      setStorageItem(KEYS.HOTELS, INITIAL_HOTELS);
    }
    if (!localStorage.getItem(KEYS.AGENTS)) {
      setStorageItem(KEYS.AGENTS, INITIAL_AGENTS);
    }
    if (!localStorage.getItem(KEYS.BOOKINGS)) {
      setStorageItem(KEYS.BOOKINGS, INITIAL_BOOKINGS);
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      setStorageItem(KEYS.SETTINGS, INITIAL_SETTINGS);
    }

    // Background sync from Supabase
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

      if (templates && templates.length > 0) setStorageItem(KEYS.TEMPLATES, templates);
      if (tours && tours.length > 0) setStorageItem(KEYS.TOURS, tours);
      if (hotels && hotels.length > 0) setStorageItem(KEYS.HOTELS, hotels);
      if (agents && agents.length > 0) setStorageItem(KEYS.AGENTS, agents);
      if (bookings && bookings.length > 0) setStorageItem(KEYS.BOOKINGS, bookings);
      if (settings) setStorageItem(KEYS.SETTINGS, settings);
    } catch (e) {
      console.warn('Supabase sync warning:', e);
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

  // Templates
  getTemplates: (): BusLayoutTemplate[] => getStorageItem(KEYS.TEMPLATES, INITIAL_BUS_TEMPLATES),
  saveTemplates: (templates: BusLayoutTemplate[]) => {
    setStorageItem(KEYS.TEMPLATES, templates);
    SupabaseService.saveTemplates(templates);
  },
  getTemplateById: (id: string): BusLayoutTemplate | undefined =>
    StorageService.getTemplates().find((t) => t.id === id),

  // Tours
  getTours: (): Tour[] => getStorageItem(KEYS.TOURS, INITIAL_TOURS),
  saveTours: (tours: Tour[]) => {
    setStorageItem(KEYS.TOURS, tours);
    SupabaseService.saveTours(tours);
  },
  getTourById: (id: string): Tour | undefined =>
    StorageService.getTours().find((t) => t.id === id),

  // Hotels
  getHotels: (): Hotel[] => getStorageItem(KEYS.HOTELS, INITIAL_HOTELS),
  saveHotels: (hotels: Hotel[]) => {
    setStorageItem(KEYS.HOTELS, hotels);
    SupabaseService.saveHotels(hotels);
  },
  getHotelById: (id: string): Hotel | undefined =>
    StorageService.getHotels().find((h) => h.id === id),

  // Agents
  getAgents: (): Agent[] => getStorageItem(KEYS.AGENTS, INITIAL_AGENTS),
  saveAgents: (agents: Agent[]) => {
    setStorageItem(KEYS.AGENTS, agents);
    SupabaseService.saveAgents(agents);
  },
  getAgentById: (id: string): Agent | undefined =>
    StorageService.getAgents().find((a) => a.id === id || a.code === id),

  // Bookings
  getBookings: (): Booking[] => getStorageItem(KEYS.BOOKINGS, INITIAL_BOOKINGS),
  saveBookings: (bookings: Booking[]) => {
    setStorageItem(KEYS.BOOKINGS, bookings);
    SupabaseService.saveBookings(bookings);
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

