import { supabase } from '../lib/supabase';
import {
  Tour,
  BusLayoutTemplate,
  Hotel,
  Agent,
  Booking,
  SystemSettings,
} from '../types';

export const SupabaseService = {
  // Test Connection
  checkConnection: async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from('system_settings').select('id').limit(1);
      if (error) {
        console.warn('Supabase connection or table check warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase error:', e);
      return false;
    }
  },

  // Bus Layout Templates
  fetchTemplates: async (): Promise<BusLayoutTemplate[] | null> => {
    try {
      const { data, error } = await supabase.from('bus_layout_templates').select('*');
      if (error || !data) return null;
      return data.map((item) => ({
        id: item.id,
        name: item.name,
        busType: item.bus_type,
        totalSeats: item.total_seats,
        rows: item.rows,
        cols: item.cols,
        seats: typeof item.seats === 'string' ? JSON.parse(item.seats) : item.seats,
        aisleCol: item.aisle_col,
        hasDriver: item.has_driver,
        hasDoor: item.has_door,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch {
      return null;
    }
  },

  saveTemplates: async (templates: BusLayoutTemplate[]): Promise<boolean> => {
    try {
      const rows = templates.map((item) => ({
        id: item.id,
        name: item.name,
        bus_type: item.busType,
        total_seats: item.totalSeats,
        rows: item.rows,
        cols: item.cols,
        seats: item.seats,
        aisle_col: item.aisleCol,
        has_driver: item.hasDriver,
        has_door: item.hasDoor,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }));
      const { error } = await supabase.from('bus_layout_templates').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // Tours
  fetchTours: async (): Promise<Tour[] | null> => {
    try {
      const { data, error } = await supabase.from('tours').select('*');
      if (error || !data) return null;
      return data.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        tourCategory: item.tour_category || 'Relax',
        startDate: item.start_date,
        endDate: item.end_date,
        fee: Number(item.fee),
        discountAllowed: Number(item.discount_allowed),
        busType: item.bus_type,
        layoutTemplateId: item.layout_template_id,
        totalSeats: item.total_seats,
        hotelId: item.hotel_id,
        agentIds: typeof item.agent_ids === 'string' ? JSON.parse(item.agent_ids) : item.agent_ids || [],
        status: item.status,
        description: item.description,
        imageUrl: item.image_url,
        createdAt: item.created_at,
      }));
    } catch {
      return null;
    }
  },

  saveTours: async (tours: Tour[]): Promise<boolean> => {
    try {
      const rows = tours.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        tour_category: item.tourCategory || 'Relax',
        start_date: item.startDate,
        end_date: item.endDate,
        fee: item.fee,
        discount_allowed: item.discountAllowed,
        bus_type: item.busType,
        layout_template_id: item.layoutTemplateId,
        total_seats: item.totalSeats,
        hotel_id: item.hotelId || null,
        agent_ids: item.agentIds || [],
        status: item.status,
        description: item.description || '',
        image_url: item.imageUrl || '',
        created_at: item.createdAt,
      }));
      const { error } = await supabase.from('tours').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // Hotels
  fetchHotels: async (): Promise<Hotel[] | null> => {
    try {
      const { data, error } = await supabase.from('hotels').select('*');
      if (error || !data) return null;
      return data.map((item) => ({
        id: item.id,
        name: item.name,
        address: item.address,
        phone: item.phone,
        tourId: item.tour_id,
        checkInDate: item.check_in_date,
        checkOutDate: item.check_out_date,
        totalRooms: item.total_rooms,
        rooms: typeof item.rooms === 'string' ? JSON.parse(item.rooms) : item.rooms || [],
      }));
    } catch {
      return null;
    }
  },

  saveHotels: async (hotels: Hotel[]): Promise<boolean> => {
    try {
      const rows = hotels.map((item) => ({
        id: item.id,
        name: item.name,
        address: item.address,
        phone: item.phone,
        tour_id: item.tourId || null,
        check_in_date: item.checkInDate || null,
        check_out_date: item.checkOutDate || null,
        total_rooms: item.totalRooms,
        rooms: item.rooms || [],
      }));
      const { error } = await supabase.from('hotels').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // Agents
  fetchAgents: async (): Promise<Agent[] | null> => {
    try {
      const { data, error } = await supabase.from('agents').select('*');
      if (error || !data) return null;
      return data.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        agencyName: item.agency_name,
        phone: item.phone,
        email: item.email,
        commissionRate: Number(item.commission_rate),
        status: item.status,
      }));
    } catch {
      return null;
    }
  },

  saveAgents: async (agents: Agent[]): Promise<boolean> => {
    try {
      const rows = agents.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        agency_name: item.agencyName,
        phone: item.phone,
        email: item.email || '',
        commission_rate: item.commissionRate,
        status: item.status,
      }));
      const { error } = await supabase.from('agents').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // Bookings
  fetchBookings: async (): Promise<Booking[] | null> => {
    try {
      const { data, error } = await supabase.from('bookings').select('*');
      if (error || !data) return null;
      return data.map((item) => ({
        id: item.id,
        tourId: item.tour_id,
        agentId: item.agent_id,
        bookerCode: item.booker_code,
        agentName: item.agent_name,
        customerName: item.customer_name,
        customerPhone: item.customer_phone,
        customerAltPhone: item.customer_alt_phone,
        customerAddress: item.customer_address,
        customerGender: item.customer_gender,
        customerReligion: item.customer_religion,
        selectedSeats: typeof item.selected_seats === 'string' ? JSON.parse(item.selected_seats) : item.selected_seats || [],
        groupType: item.group_type,
        groupId: item.group_id,
        passengerCount: item.passenger_count,
        passengers: typeof item.passengers === 'string' ? JSON.parse(item.passengers) : item.passengers || [],
        totalFee: Number(item.total_fee),
        discount: Number(item.discount),
        payableAmount: Number(item.payable_amount),
        advanceAmount: Number(item.advance_amount),
        dueAmount: Number(item.due_amount),
        paymentStatus: item.payment_status,
        bookingStatus: item.booking_status,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch {
      return null;
    }
  },

  saveBookings: async (bookings: Booking[]): Promise<boolean> => {
    try {
      const rows = bookings.map((item) => ({
        id: item.id,
        tour_id: item.tourId,
        agent_id: item.agentId,
        booker_code: item.bookerCode,
        agent_name: item.agentName || '',
        customer_name: item.customerName,
        customer_phone: item.customerPhone,
        customer_alt_phone: item.customerAltPhone || '',
        customer_address: item.customerAddress || '',
        customer_gender: item.customerGender,
        customer_religion: item.customerReligion,
        selected_seats: item.selectedSeats,
        group_type: item.groupType,
        group_id: item.groupId || '',
        passenger_count: item.passengerCount,
        passengers: item.passengers,
        total_fee: item.totalFee,
        discount: item.discount,
        payable_amount: item.payableAmount,
        advance_amount: item.advanceAmount,
        due_amount: item.dueAmount,
        payment_status: item.paymentStatus,
        booking_status: item.bookingStatus,
        notes: item.notes || '',
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }));
      const { error } = await supabase.from('bookings').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // System Settings
  fetchSettings: async (): Promise<SystemSettings | null> => {
    try {
      const { data, error } = await supabase.from('system_settings').select('*').limit(1);
      if (error || !data || data.length === 0) return null;
      const item = data[0];
      return {
        businessName: item.business_name,
        tagline: item.tagline,
        logoUrl: item.logo_url,
        phone: item.phone,
        email: item.email,
        address: item.address,
        currency: item.currency,
        printSettings: typeof item.print_settings === 'string' ? JSON.parse(item.print_settings) : item.print_settings,
      };
    } catch {
      return null;
    }
  },

  saveSettings: async (settings: SystemSettings): Promise<boolean> => {
    try {
      const row = {
        id: 'main_settings',
        business_name: settings.businessName,
        tagline: settings.tagline,
        logo_url: settings.logoUrl || '',
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        currency: settings.currency,
        print_settings: settings.printSettings,
      };
      const { error } = await supabase.from('system_settings').upsert([row]);
      return !error;
    } catch {
      return false;
    }
  },
};
