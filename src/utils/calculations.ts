import {
  Booking,
  Hotel,
  Passenger,
  Tour,
  HotelRoom,
} from '../types';

export const CalculationUtils = {
  // Format currency with symbol (৳)
  formatCurrency: (amount: number, currency: string = '৳'): string => {
    return `${currency} ${amount.toLocaleString('en-BD')}`;
  },

  // Calculate booked seats for a specific tour
  getBookedSeatsForTour: (tourId: string, bookings: Booking[]): Set<string> => {
    const booked = new Set<string>();
    bookings
      .filter((b) => b.tourId === tourId && b.bookingStatus !== 'Cancelled')
      .forEach((b) => {
        b.selectedSeats.forEach((seat) => booked.add(seat));
      });
    return booked;
  },

  // Get seat gender mapping for visual seat map (shows gender color)
  getSeatGenderMappingForTour: (tourId: string, bookings: Booking[]): Record<string, { gender: string; religion: string; passengerName: string }> => {
    const map: Record<string, { gender: string; religion: string; passengerName: string }> = {};
    bookings
      .filter((b) => b.tourId === tourId && b.bookingStatus !== 'Cancelled')
      .forEach((b) => {
        b.passengers.forEach((p) => {
          if (p.seatNumber) {
            map[p.seatNumber] = {
              gender: p.gender,
              religion: p.religion,
              passengerName: p.name,
            };
          }
        });
      });
    return map;
  },

  // Calculate unassigned passengers for a tour or all tours
  getUnassignedPassengers: (
    tourId: string | null,
    bookings: Booking[],
    hotels: Hotel[]
  ): { passenger: Passenger; booking: Booking; tourName?: string }[] => {
    // Collect all assigned passenger IDs across all hotel rooms
    const assignedIds = new Set<string>();
    hotels.forEach((h) => {
      h.rooms.forEach((r) => {
        r.assignedPassengerIds.forEach((id) => assignedIds.add(id));
      });
    });

    const unassigned: { passenger: Passenger; booking: Booking; tourName?: string }[] = [];

    bookings
      .filter((b) => b.bookingStatus !== 'Cancelled' && (!tourId || b.tourId === tourId))
      .forEach((b) => {
        b.passengers.forEach((p) => {
          if (!assignedIds.has(p.id)) {
            unassigned.push({ passenger: p, booking: b });
          }
        });
      });

    return unassigned;
  },

  // Calculate hotel dashboard summary statistics
  getHotelSummaryStats: (hotels: Hotel[], bookings: Booking[], selectedTourId?: string) => {
    const relevantHotels = selectedTourId
      ? hotels.filter((h) => h.tourId === selectedTourId || true)
      : hotels;

    let totalRooms = 0;
    let occupiedRooms = 0;
    let availableRooms = 0;
    let partiallyFilledRooms = 0;
    let combinedCount = 0;
    let coupleCount = 0;
    let familyCount = 0;

    relevantHotels.forEach((h) => {
      h.rooms.forEach((r) => {
        totalRooms++;
        if (r.roomType === 'Combined') combinedCount++;
        if (r.roomType === 'Couple') coupleCount++;
        if (r.roomType === 'Family') familyCount++;

        if (r.assignedPassengerIds.length === 0) {
          availableRooms++;
        } else if (r.assignedPassengerIds.length >= r.capacity) {
          occupiedRooms++;
        } else {
          partiallyFilledRooms++;
        }
      });
    });

    const unassignedPassengers = CalculationUtils.getUnassignedPassengers(
      selectedTourId || null,
      bookings,
      hotels
    );

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      partiallyFilledRooms,
      combinedCount,
      coupleCount,
      familyCount,
      unassignedCount: unassignedPassengers.length,
      unassignedList: unassignedPassengers,
    };
  },

  // Financial summary calculations
  getFinancialSummary: (bookings: Booking[], selectedTourId?: string) => {
    const filtered = selectedTourId
      ? bookings.filter((b) => b.tourId === selectedTourId && b.bookingStatus !== 'Cancelled')
      : bookings.filter((b) => b.bookingStatus !== 'Cancelled');

    const totalRevenue = filtered.reduce((acc, b) => acc + b.payableAmount, 0);
    const totalAdvance = filtered.reduce((acc, b) => acc + b.advanceAmount, 0);
    const totalDue = filtered.reduce((acc, b) => acc + b.dueAmount, 0);
    const totalDiscount = filtered.reduce((acc, b) => acc + b.discount, 0);
    const totalPassengers = filtered.reduce((acc, b) => acc + b.passengerCount, 0);

    return {
      totalRevenue,
      totalAdvance,
      totalDue,
      totalDiscount,
      totalPassengers,
      totalBookings: filtered.length,
    };
  },

  // Generate unique group ID based on type
  generateGroupId: (type: 'Couple' | 'Family' | 'Group'): string => {
    const prefix = type === 'Couple' ? 'CP' : type === 'Family' ? 'FM' : 'GR';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${rand}`;
  },

  // Generate unique booking ID
  generateBookingId: (): string => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `TL-BK-${rand}`;
  },
};
