import { Booking, Tour, Hotel, HotelRoom, Agent, Passenger } from '../types';

/**
 * Clean CSV Exporter Utility
 * Ensures Bengali characters are encoded properly (UTF-8 BOM) and
 * strips out all confidential/agent secrets and passwords.
 */

function downloadCSVFile(csvContent: string, fileName: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export const CSVExportService = {
  // Export Bookings
  exportBookings: (bookings: Booking[], tours: Tour[]) => {
    const headers = [
      'বুকিং আইডি',
      'ট্যুর নাম',
      'প্রধান গ্রাহকের নাম',
      'মোবাইল নম্বর',
      'বিকল্প মোবাইল',
      'ঠিকানা',
      'সিট সংখ্যা',
      'সিটসমূহ',
      'বুকিং এজেন্ট',
      'মোট ফি',
      'ছাড়',
      'পরিশোধযোগ্য',
      'অগ্রিম জমা',
      'বকেয়া',
      'পেমেন্ট স্ট্যাটাস',
      'তারিখ',
    ];

    const rows = bookings.map((b) => {
      const tour = tours.find((t) => t.id === b.tourId);
      return [
        b.id,
        tour?.name || b.tourId,
        b.customerName,
        b.customerPhone,
        b.customerAltPhone || 'N/A',
        b.customerAddress || 'N/A',
        b.selectedSeats.length,
        b.selectedSeats.join(', '),
        b.agentName || 'HQ Direct',
        b.totalFee,
        b.discount,
        b.payableAmount,
        b.advanceAmount,
        b.dueAmount,
        b.paymentStatus,
        new Date(b.createdAt).toLocaleDateString('bn-BD'),
      ].map(escapeCSV).join(',');
    });

    const csvStr = [headers.join(','), ...rows].join('\n');
    downloadCSVFile(csvStr, `Tour_Bookings_Report_${Date.now()}.csv`);
  },

  // Export Tours
  exportTours: (tours: Tour[]) => {
    const headers = [
      'ট্যুর নাম',
      'ধরণ',
      'যাত্রার তারিখ',
      'ফেরার তারিখ',
      'ফি (প্রতি সিট)',
      'বাস টাইপ',
      'মোট সিট',
      'স্ট্যাটাস',
    ];

    const rows = tours.map((t) => [
      t.name,
      t.type,
      t.startDate,
      t.endDate,
      t.fee,
      t.busType,
      t.totalSeats,
      t.status,
    ].map(escapeCSV).join(','));

    const csvStr = [headers.join(','), ...rows].join('\n');
    downloadCSVFile(csvStr, `Tours_List_${Date.now()}.csv`);
  },

  // Export Hotels
  exportHotels: (hotels: Hotel[]) => {
    const headers = [
      'হোটেলের নাম',
      'ঠিকানা',
      'ফোন নম্বর',
      'মোট রুম সংখ্যা',
    ];

    const rows = hotels.map((h) => [
      h.name,
      h.address,
      h.phone,
      h.totalRooms,
    ].map(escapeCSV).join(','));

    const csvStr = [headers.join(','), ...rows].join('\n');
    downloadCSVFile(csvStr, `Hotels_Report_${Date.now()}.csv`);
  },

  // Export Room Assignments
  exportRoomAssignments: (hotels: Hotel[], bookings: Booking[]) => {
    const headers = [
      'হোটেল নাম',
      'রুম নম্বর',
      'রুম ধরণ',
      'ক্যাপাসিটি',
      'বরাদ্দকৃত যাত্রী/গ্রাহক',
      'ফোন নম্বর',
      'সিট',
      'বুকিং আইডি',
    ];

    const rows: string[] = [];

    hotels.forEach((hotel) => {
      hotel.rooms.forEach((room) => {
        if (room.assignedPassengerIds.length === 0) {
          rows.push([
            hotel.name,
            room.roomNumber,
            room.roomType,
            room.capacity,
            'ফাঁকা (Unassigned)',
            '-',
            '-',
            '-',
          ].map(escapeCSV).join(','));
        } else {
          room.assignedPassengerIds.forEach((psgId) => {
            let foundPsg: Passenger | undefined;
            let foundBooking: Booking | undefined;

            for (const b of bookings) {
              const p = b.passengers.find((item) => item.id === psgId);
              if (p) {
                foundPsg = p;
                foundBooking = b;
                break;
              }
            }

            rows.push([
              hotel.name,
              room.roomNumber,
              room.roomType,
              room.capacity,
              foundPsg ? foundPsg.name : 'Unknown Passenger',
              foundPsg?.phone || foundBooking?.customerPhone || '-',
              foundPsg?.seatNumber || '-',
              foundBooking?.id || '-',
            ].map(escapeCSV).join(','));
          });
        }
      });
    });

    const csvStr = [headers.join(','), ...rows].join('\n');
    downloadCSVFile(csvStr, `Hotel_Room_Assignments_${Date.now()}.csv`);
  },

  // Export Agents (ONLY Name, Agency, Phone, Commission - NO CODE or PASSWORD)
  exportAgents: (agents: Agent[]) => {
    const headers = [
      'এজেন্টের নাম',
      'এজেন্সির নাম',
      'ফোন নম্বর',
      'ইমেইল',
      'স্ট্যাটাস',
    ];

    const rows = agents.map((a) => [
      a.name,
      a.agencyName,
      a.phone,
      a.email || 'N/A',
      a.status,
    ].map(escapeCSV).join(','));

    const csvStr = [headers.join(','), ...rows].join('\n');
    downloadCSVFile(csvStr, `Agents_Directory_${Date.now()}.csv`);
  },
};
