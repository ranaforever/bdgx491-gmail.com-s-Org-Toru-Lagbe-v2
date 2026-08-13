import {
  BusLayoutTemplate,
  Tour,
  Hotel,
  Agent,
  Booking,
  SystemSettings,
  BusSeat,
} from '../types';

// Helper to generate a 40-seat bus layout (A1 A2 | A3 A4)
const generate40SeatLayout = (id: string, name: string, busType: 'AC' | 'Non-AC'): BusLayoutTemplate => {
  const seats: BusSeat[] = [];
  const rows = 10;
  const cols = 5; // col 3 is aisle
  const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  for (let r = 0; r < rows; r++) {
    const letter = rowLetters[r];
    // Col 1 & 2 (Left side)
    seats.push({ id: `${id}-${letter}1`, label: `${letter}1`, row: r + 1, col: 1, type: 'Regular' });
    seats.push({ id: `${id}-${letter}2`, label: `${letter}2`, row: r + 1, col: 2, type: 'Regular' });
    // Col 3 is aisle (empty space)
    seats.push({ id: `${id}-${letter}-aisle`, label: '', row: r + 1, col: 3, type: 'Empty' });
    // Col 4 & 5 (Right side)
    seats.push({ id: `${id}-${letter}3`, label: `${letter}3`, row: r + 1, col: 4, type: 'Regular' });
    seats.push({ id: `${id}-${letter}4`, label: `${letter}4`, row: r + 1, col: 5, type: 'Regular' });
  }

  return {
    id,
    name,
    busType,
    totalSeats: 40,
    rows: 10,
    cols: 5,
    aisleCol: 3,
    hasDriver: true,
    hasDoor: true,
    seats,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const INITIAL_BUS_TEMPLATES: BusLayoutTemplate[] = [
  generate40SeatLayout('tmpl-ac-40', 'AC Deluxe 40 Seats (2x2)', 'AC'),
  generate40SeatLayout('tmpl-nonac-40', 'Non-AC Chair Coach 40 Seats', 'Non-AC'),
  {
    id: 'tmpl-ac-36-vip',
    name: 'AC VIP 36 Seats (2x1 Business)',
    busType: 'AC',
    totalSeats: 36,
    rows: 9,
    cols: 5,
    aisleCol: 3,
    hasDriver: true,
    hasDoor: true,
    seats: [
      // Row 1 to 9
      ...Array.from({ length: 9 }).flatMap((_, r) => {
        const letter = String.fromCharCode(65 + r);
        return [
          { id: `vip-${letter}1`, label: `${letter}1`, row: r + 1, col: 1, type: 'VIP' as const },
          { id: `vip-${letter}2`, label: `${letter}2`, row: r + 1, col: 2, type: 'VIP' as const },
          { id: `vip-${letter}-aisle`, label: '', row: r + 1, col: 3, type: 'Empty' as const },
          { id: `vip-${letter}3`, label: `${letter}3`, row: r + 1, col: 4, type: 'VIP' as const },
          { id: `vip-${letter}4`, label: `${letter}4`, row: r + 1, col: 5, type: 'VIP' as const },
        ];
      })
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agt-101',
    code: 'AGT-101',
    name: 'Rahim Uddin',
    agencyName: 'ABC Travels Dhaka',
    phone: '01711223344',
    email: 'abc.dhaka@tourlagbe.com',
    commissionRate: 10,
    status: 'Active',
  },
  {
    id: 'agt-102',
    code: 'AGT-102',
    name: 'Tanvir Hossain',
    agencyName: 'Chittagong Express',
    phone: '01819887766',
    email: 'ctg.express@tourlagbe.com',
    commissionRate: 12,
    status: 'Active',
  },
  {
    id: 'agt-103',
    code: 'AGT-103',
    name: 'Farhana Ahmed',
    agencyName: 'Dhaka Tour Hub',
    phone: '01912345678',
    email: 'dhakatourhub@gmail.com',
    commissionRate: 8,
    status: 'Active',
  },
];

export const INITIAL_HOTELS: Hotel[] = [
  {
    id: 'htl-cox-01',
    name: 'Sea Gull Hotel & Resort, Cox\'s Bazar',
    address: 'Kolatoli Beach Road, Cox\'s Bazar',
    phone: '+88034162480',
    totalRooms: 6,
    rooms: [
      {
        id: 'rm-101',
        hotelId: 'htl-cox-01',
        roomNumber: '101',
        roomType: 'Combined',
        capacity: 4,
        assignedPassengerIds: ['psg-001', 'psg-002', 'psg-003', 'psg-004'],
        status: 'Occupied',
      },
      {
        id: 'rm-102',
        hotelId: 'htl-cox-01',
        roomNumber: '102',
        roomType: 'Couple',
        capacity: 2,
        assignedPassengerIds: ['psg-005', 'psg-006'],
        status: 'Occupied',
      },
      {
        id: 'rm-103',
        hotelId: 'htl-cox-01',
        roomNumber: '103',
        roomType: 'Family',
        capacity: 4,
        assignedPassengerIds: ['psg-007', 'psg-008', 'psg-009'],
        status: 'Partially Filled',
      },
      {
        id: 'rm-104',
        hotelId: 'htl-cox-01',
        roomNumber: '104',
        roomType: 'Combined',
        capacity: 4,
        assignedPassengerIds: [],
        status: 'Available',
      },
      {
        id: 'rm-105',
        hotelId: 'htl-cox-01',
        roomNumber: '105',
        roomType: 'Couple',
        capacity: 2,
        assignedPassengerIds: [],
        status: 'Available',
      },
    ],
  },
  {
    id: 'htl-sajek-01',
    name: 'Sajek Hillview Resort, Ruilui Para',
    address: 'Ruilui Para, Sajek Valley, Rangamati',
    phone: '01822334455',
    totalRooms: 4,
    rooms: [
      {
        id: 'rm-201',
        hotelId: 'htl-sajek-01',
        roomNumber: '201',
        roomType: 'Couple',
        capacity: 2,
        assignedPassengerIds: [],
        status: 'Available',
      },
      {
        id: 'rm-202',
        hotelId: 'htl-sajek-01',
        roomNumber: '202',
        roomType: 'Family',
        capacity: 4,
        assignedPassengerIds: [],
        status: 'Available',
      },
    ],
  },
];

export const INITIAL_TOURS: Tour[] = [
  {
    id: 'tour-cox-01',
    name: 'Cox\'s Bazar Sea Beach Grand Tour',
    type: 'Beach Resort & Ocean Cruise',
    tourCategory: 'Relax',
    startDate: '2026-08-20',
    endDate: '2026-08-23',
    fee: 4500,
    discountAllowed: 500,
    busType: 'AC',
    layoutTemplateId: 'tmpl-ac-40',
    totalSeats: 40,
    hotelId: 'htl-cox-01',
    agentIds: ['agt-101', 'agt-102'],
    status: 'Upcoming',
    description: '3 Days 2 Nights Deluxe AC Bus tour to Cox\'s Bazar with Sea Seagull Resort accommodation.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tour-sajek-01',
    name: 'Sajek Valley Cloud Expedition',
    type: 'Hill Tracts & Cloud Camping',
    tourCategory: 'Relax',
    startDate: '2026-09-05',
    endDate: '2026-09-08',
    fee: 5200,
    discountAllowed: 400,
    busType: 'AC',
    layoutTemplateId: 'tmpl-ac-36-vip',
    totalSeats: 36,
    hotelId: 'htl-sajek-01',
    agentIds: ['agt-101', 'agt-103'],
    status: 'Upcoming',
    description: 'Cloud scenery tour to Sajek Valley, Chander Gari transfer included.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tour-sreemangal-01',
    name: 'Sreemangal Day-Long Tea Garden Tour',
    type: 'Eco Tour & Nature',
    tourCategory: 'Day Long',
    startDate: '2026-09-18',
    endDate: '2026-09-18',
    fee: 2200,
    discountAllowed: 200,
    busType: 'Non-AC',
    layoutTemplateId: 'tmpl-nonac-40',
    totalSeats: 40,
    agentIds: ['agt-102', 'agt-103'],
    status: 'Upcoming',
    description: '1 Day Long eco-tour in Sreemangal tea estates (Hotel not required).',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'TL-BK-1001',
    tourId: 'tour-cox-01',
    agentId: 'agt-101',
    bookerCode: 'AGT-101',
    customerName: 'Abdur Rahim',
    customerPhone: '01710000001',
    customerGender: 'Male',
    customerReligion: 'Islam',
    selectedSeats: ['A1', 'A2', 'A3', 'A4'],
    groupType: 'Group',
    groupId: 'GR-1001',
    passengerCount: 4,
    passengers: [
      { id: 'psg-001', bookingId: 'TL-BK-1001', name: 'Abdur Rahim', phone: '01710000001', gender: 'Male', religion: 'Islam', seatNumber: 'A1' },
      { id: 'psg-002', bookingId: 'TL-BK-1001', name: 'Karim Ahmed', phone: '01710000002', gender: 'Male', religion: 'Islam', seatNumber: 'A2' },
      { id: 'psg-003', bookingId: 'TL-BK-1001', name: 'Hasan Mahmud', phone: '01710000003', gender: 'Male', religion: 'Islam', seatNumber: 'A3' },
      { id: 'psg-004', bookingId: 'TL-BK-1001', name: 'Sakib Khan', phone: '01710000004', gender: 'Male', religion: 'Islam', seatNumber: 'A4' },
    ],
    totalFee: 18000, // 4 x 4500
    discount: 1000,
    payableAmount: 17000,
    advanceAmount: 10000,
    dueAmount: 7000,
    paymentStatus: 'Partial',
    bookingStatus: 'Confirmed',
    notes: 'Group booking for Room 101',
    createdAt: new Date('2026-08-01').toISOString(),
    updatedAt: new Date('2026-08-01').toISOString(),
  },
  {
    id: 'TL-BK-1002',
    tourId: 'tour-cox-01',
    agentId: 'agt-101',
    bookerCode: 'AGT-101',
    customerName: 'Tariqul Islam',
    customerPhone: '01810000005',
    customerGender: 'Male',
    customerReligion: 'Islam',
    selectedSeats: ['B1', 'B2'],
    groupType: 'Couple',
    groupId: 'CP-1002',
    passengerCount: 2,
    passengers: [
      { id: 'psg-005', bookingId: 'TL-BK-1002', name: 'Tariqul Islam', phone: '01810000005', gender: 'Male', religion: 'Islam', seatNumber: 'B1' },
      { id: 'psg-006', bookingId: 'TL-BK-1002', name: 'Nusrat Jahan', phone: '01810000006', gender: 'Female', religion: 'Islam', seatNumber: 'B2' },
    ],
    totalFee: 9000, // 2 x 4500
    discount: 500,
    payableAmount: 8500,
    advanceAmount: 8500,
    dueAmount: 0,
    paymentStatus: 'Paid',
    bookingStatus: 'Confirmed',
    notes: 'Honeymoon couple, requires Couple Room',
    createdAt: new Date('2026-08-02').toISOString(),
    updatedAt: new Date('2026-08-02').toISOString(),
  },
  {
    id: 'TL-BK-1003',
    tourId: 'tour-cox-01',
    agentId: 'agt-102',
    bookerCode: 'AGT-102',
    customerName: 'Rafiqul Alam',
    customerPhone: '01910000007',
    customerGender: 'Male',
    customerReligion: 'Islam',
    selectedSeats: ['C1', 'C2', 'C3'],
    groupType: 'Family',
    groupId: 'FM-1003',
    passengerCount: 3,
    passengers: [
      { id: 'psg-007', bookingId: 'TL-BK-1003', name: 'Rafiqul Alam', phone: '01910000007', gender: 'Male', religion: 'Islam', seatNumber: 'C1' },
      { id: 'psg-008', bookingId: 'TL-BK-1003', name: 'Sultana Begum', phone: '01910000008', gender: 'Female', religion: 'Islam', seatNumber: 'C2' },
      { id: 'psg-009', bookingId: 'TL-BK-1003', name: 'Arafat Alam (Child)', phone: '01910000009', gender: 'Male', religion: 'Islam', seatNumber: 'C3' },
    ],
    totalFee: 13500,
    discount: 1000,
    payableAmount: 12500,
    advanceAmount: 5000,
    dueAmount: 7500,
    paymentStatus: 'Partial',
    bookingStatus: 'Confirmed',
    notes: 'Family assigned to Room 103',
    createdAt: new Date('2026-08-03').toISOString(),
    updatedAt: new Date('2026-08-03').toISOString(),
  },
  {
    id: 'TL-BK-1004',
    tourId: 'tour-cox-01',
    agentId: 'agt-102',
    bookerCode: 'AGT-102',
    customerName: 'Anowar Hossain',
    customerPhone: '01610000010',
    customerGender: 'Male',
    customerReligion: 'Islam',
    selectedSeats: ['D1', 'D2'],
    groupType: 'Couple',
    groupId: 'CP-1004',
    passengerCount: 2,
    passengers: [
      { id: 'psg-010', bookingId: 'TL-BK-1004', name: 'Anowar Hossain', phone: '01610000010', gender: 'Male', religion: 'Islam', seatNumber: 'D1' },
      { id: 'psg-011', bookingId: 'TL-BK-1004', name: 'Sharmin Akter', phone: '01610000011', gender: 'Female', religion: 'Islam', seatNumber: 'D2' },
    ],
    totalFee: 9000,
    discount: 500,
    payableAmount: 8500,
    advanceAmount: 3000,
    dueAmount: 5500,
    paymentStatus: 'Partial',
    bookingStatus: 'Confirmed',
    notes: 'Unassigned couple! Needs room assignment',
    createdAt: new Date('2026-08-04').toISOString(),
    updatedAt: new Date('2026-08-04').toISOString(),
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  businessName: 'Tour লাগবে',
  tagline: 'সহজ ও বিশ্বস্ত ট্যুর এবং বাস টিকিট বুকিং সিস্টেম',
  phone: '01700-000000',
  email: 'support@tourlagbe.com',
  address: 'Level 4, Gulshan 2, Dhaka, Bangladesh',
  currency: '৳',
  printSettings: {
    ticketWidth: 80,
    ticketHeight: 180,
    ticketUnit: 'mm',
    ticketOrientation: 'portrait',
    ticketMargin: 4,
    fontSize: 10,
    showLogo: true,
    showQR: true,
    showTerms: true,
    presetName: 'Thermal 80mm',
    tokenWidth: 80,
    tokenHeight: 100,
    tokenUnit: 'mm',
    tokenFontSize: 9,
    showTokenQR: true,
  },
};
