/**
 * Tour লাগবে (Tour Lagbe) - Complete Domain Type Definitions
 */

export type Gender = 'Male' | 'Female' | 'Other';
export type Religion = 'Islam' | 'Hindu' | 'Christian' | 'Buddhist' | 'Other';

export type BusType = 'AC' | 'Non-AC';

export type SeatType = 
  | 'Regular' 
  | 'Sleeper' 
  | 'VIP' 
  | 'Couple' 
  | 'Special' 
  | 'Blocked' 
  | 'Driver' 
  | 'Empty';

export interface BusSeat {
  id: string;
  label: string; // e.g. A1, A2, B1, B2
  row: number; // 1-indexed
  col: number; // 1-indexed (e.g. 1 to 5)
  type: SeatType;
  isAvailable?: boolean;
  isBlocked?: boolean;
  notes?: string;
}

export interface BusLayoutTemplate {
  id: string;
  name: string; // e.g., "AC Deluxe 40 Seats", "Non-AC 44 Seats"
  busType: BusType;
  totalSeats: number;
  rows: number;
  cols: number; // e.g. 4 or 5 seats wide (including aisle)
  seats: BusSeat[];
  aisleCol: number; // column index where aisle is located, e.g., 3
  hasDriver: boolean;
  hasDoor: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TourStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
export type TourCategory = 'Day Long' | 'Relax';

export interface Tour {
  id: string;
  name: string; // e.g., "Cox's Bazar Sea Beach Mega Tour"
  type: string; // e.g., "Beach & Resort", "Hill Tracts", "Tea Garden"
  tourCategory?: TourCategory; // 'Day Long' | 'Relax'
  startDate: string;
  endDate: string;
  fee: number; // Regular Fee per passenger
  discountAllowed: number; // Default discount or max discount
  busType: BusType;
  layoutTemplateId: string; // References BusLayoutTemplate
  totalSeats: number;
  hotelId?: string; // Associated hotel
  agentIds: string[]; // Associated agents/bookers
  status: TourStatus;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

export type GroupType = 'Single' | 'Couple' | 'Family' | 'Group';

export interface Passenger {
  id: string;
  bookingId: string;
  name: string;
  phone: string;
  gender: Gender;
  religion: Religion;
  seatNumber: string; // e.g., "A1"
  age?: number;
  notes?: string;
}

export interface BookingGroup {
  id: string; // e.g., "CP-1001", "FM-2001", "GR-3001"
  type: GroupType;
  name: string; // e.g., "Rahim & Nusrat (Couple)" or "Khan Family"
  passengerIds: string[];
}

export type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface Booking {
  id: string; // e.g. "TL-BK-1001"
  tourId: string;
  agentId: string; // Booker/Agent code or ID
  bookerCode: string; // e.g. "AGT-001"
  agentName?: string; // Human name / Agency name of booker
  customerName: string; // Primary contact
  customerPhone: string;
  customerAltPhone?: string; // Alternative contact number (+880...)
  customerAddress?: string; // Passenger address
  customerGender: Gender;
  customerReligion: Religion;
  selectedSeats: string[]; // e.g. ["A1", "A2"]
  groupType: GroupType;
  groupId?: string; // Linked group ID
  passengerCount: number;
  passengers: Passenger[];
  totalFee: number;
  discount: number;
  payableAmount: number; // totalFee - discount
  advanceAmount: number;
  dueAmount: number; // payableAmount - advanceAmount
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RoomType = 'Combined' | 'Couple' | 'Family' | 'Single' | 'VIP';
export type RoomStatus = 'Available' | 'Partially Filled' | 'Occupied' | 'Maintenance';

export interface HotelRoom {
  id: string;
  hotelId: string;
  roomNumber: string; // e.g. "101", "202"
  roomType: RoomType;
  capacity: number;
  assignedPassengerIds: string[]; // Array of passenger IDs
  status: RoomStatus;
  floor?: string;
  notes?: string;
}

export interface Hotel {
  id: string;
  name: string; // e.g., "Sea Gull Hotel & Resort, Cox's Bazar"
  address: string;
  phone: string;
  tourId?: string; // Tour linked to this hotel
  checkInDate?: string;
  checkOutDate?: string;
  totalRooms: number;
  rooms: HotelRoom[];
}

export interface Agent {
  id: string;
  code: string; // e.g., "AGT-101"
  name: string;
  agencyName: string; // e.g., "ABC Travels", "Dhaka Tour Hub"
  phone: string;
  email?: string;
  commissionRate: number; // % commission
  status: 'Active' | 'Inactive';
}

export type TicketUnit = 'mm' | 'px' | 'in';
export type TicketOrientation = 'portrait' | 'landscape';

export interface PrintSettings {
  ticketWidth: number; // e.g. 80 for thermal, 210 for A4
  ticketHeight: number; // e.g. 150 for thermal, 297 for A4
  ticketUnit: TicketUnit;
  ticketOrientation: TicketOrientation;
  ticketMargin: number; // in mm or px
  fontSize: number; // base font size in pt or px
  showLogo: boolean;
  showQR: boolean;
  showTerms: boolean;
  presetName: 'Thermal 80mm' | 'Thermal 58mm' | 'A4 Standard' | 'A5 Compact' | 'Custom';
  
  tokenWidth: number;
  tokenHeight: number;
  tokenUnit: TicketUnit;
  tokenFontSize: number;
  showTokenQR: boolean;
}

export interface SystemSettings {
  businessName: string;
  tagline: string;
  logoUrl?: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  printSettings: PrintSettings;
}

export interface UserSession {
  role: 'admin' | 'agent';
  agentCode: string;
  agentName?: string;
  agencyName?: string;
  loggedInAt: string;
}

export interface FilterState {
  tourId: string;
  agentId: string;
  busType: string;
  gender: string;
  bookingStatus: string;
  paymentStatus: string;
  groupType: string;
  roomType: string;
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
}
