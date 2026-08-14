import React, { useState, useEffect } from 'react';
import { BusLayoutTemplate, Booking, Passenger } from '../../types';
import { HeldSeatsMap } from '../../services/realtimeService';
import { StorageService } from '../../services/storage';
import {
  X,
  User,
  Phone,
  Calendar,
  Ticket,
  CreditCard,
  Clock,
  ShieldCheck,
  MapPin,
  Users,
  Info,
  ExternalLink,
} from 'lucide-react';

interface SeatMapProps {
  layout: BusLayoutTemplate;
  bookedSeats: Set<string>;
  heldSeats?: HeldSeatsMap;
  seatGenderMap?: Record<string, { gender: string; religion: string; passengerName: string }>;
  selectedSeats: string[];
  onToggleSeat?: (seatLabel: string) => void;
  interactive?: boolean;
  tourId?: string;
  bookings?: Booking[];
  onBookedSeatClick?: (seatLabel: string, booking?: Booking) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  layout,
  bookedSeats,
  heldSeats = {},
  seatGenderMap = {},
  selectedSeats,
  onToggleSeat,
  interactive = true,
  tourId,
  bookings,
  onBookedSeatClick,
}) => {
  const [inspectedSeat, setInspectedSeat] = useState<{
    seatLabel: string;
    booking: Booking | null;
    passenger?: Passenger;
    genderInfo?: { gender: string; religion: string; passengerName: string };
  } | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectedSeat(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSeatClick = (seatLabel: string, isBooked: boolean, isBlocked: boolean, isHeld: boolean, isSelected: boolean) => {
    if (isBooked) {
      const allBookings = bookings || StorageService.getBookings();
      const matched = allBookings.find(
        (b) =>
          (!tourId || b.tourId === tourId) &&
          (b.selectedSeats?.includes(seatLabel) ||
            b.passengers?.some((p) => p.seatNumber === seatLabel)) &&
          b.bookingStatus !== 'Cancelled'
      );

      const seatPassenger = matched?.passengers?.find((p) => p.seatNumber === seatLabel);
      const genderInfo = seatGenderMap[seatLabel];

      setInspectedSeat({
        seatLabel,
        booking: matched || null,
        passenger: seatPassenger,
        genderInfo,
      });

      if (onBookedSeatClick) {
        onBookedSeatClick(seatLabel, matched);
      }
      return;
    }

    if (!interactive || isBlocked || (isHeld && !isSelected)) {
      return;
    }

    if (onToggleSeat) {
      onToggleSeat(seatLabel);
    }
  };

  // Organize seats by row
  const rowMap: Record<number, typeof layout.seats> = {};
  layout.seats.forEach((seat) => {
    if (!rowMap[seat.row]) rowMap[seat.row] = [];
    rowMap[seat.row].push(seat);
  });

  const sortedRows = Object.keys(rowMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl max-w-sm mx-auto select-none relative">
      {/* Bus Front Section */}
      <div className="border-b-2 border-dashed border-slate-700 pb-4 mb-5 flex items-center justify-between px-2 sm:px-4">
        <div className="flex items-center gap-2 bg-slate-800 text-slate-300 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{layout.busType} BUS</span>
        </div>

        {/* Driver Wheel Icon */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800 text-slate-400 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] sm:text-xs font-semibold">
          <span>ড্রাইভার</span>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 text-xs">
            🚌
          </div>
        </div>
      </div>

      {/* Seating Grid Canvas */}
      <div className="space-y-2.5 sm:space-y-3">
        {sortedRows.map((rowNum) => {
          const rowSeats = rowMap[rowNum].sort((a, b) => a.col - b.col);
          return (
            <div key={`row-${rowNum}`} className="flex items-center justify-center gap-2 sm:gap-2.5">
              {rowSeats.map((seat) => {
                // Empty Aisle space
                if (seat.type === 'Empty') {
                  return <div key={seat.id} className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />;
                }

                const isBooked = bookedSeats.has(seat.label);
                const isHeld = Boolean(heldSeats && heldSeats[seat.label]);
                const heldInfo = heldSeats?.[seat.label];
                const isSelected = selectedSeats.includes(seat.label);
                const isBlocked = seat.isBlocked || seat.type === 'Blocked';
                const passengerInfo = seatGenderMap[seat.label];

                // Determine seat color theme
                let bgClass = 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-emerald-500/20 hover:border-emerald-500 cursor-pointer';
                let statusBadge = '';

                if (isBlocked) {
                  bgClass = 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50';
                } else if (isBooked) {
                  if (passengerInfo?.gender === 'Female') {
                    bgClass = 'bg-pink-950/90 border-pink-700 text-pink-300 font-bold hover:scale-105 hover:border-pink-400 cursor-pointer shadow-md shadow-pink-950/50';
                    statusBadge = '♀';
                  } else if (passengerInfo?.gender === 'Male') {
                    bgClass = 'bg-sky-950/90 border-sky-700 text-sky-300 font-bold hover:scale-105 hover:border-sky-400 cursor-pointer shadow-md shadow-sky-950/50';
                    statusBadge = '♂';
                  } else {
                    bgClass = 'bg-rose-950/90 border-rose-700 text-rose-300 font-bold hover:scale-105 hover:border-rose-400 cursor-pointer shadow-md shadow-rose-950/50';
                  }
                } else if (isHeld && !isSelected) {
                  bgClass = 'bg-amber-950/90 border-amber-500/80 text-amber-300 font-bold animate-pulse cursor-not-allowed shadow-lg shadow-amber-500/20';
                  statusBadge = '⏳';
                } else if (isSelected) {
                  bgClass = 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 scale-105';
                }

                // Special type styling
                const isSleeper = seat.type === 'Sleeper';
                const isVIP = seat.type === 'VIP';

                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={(!isBooked && !interactive) || isBlocked || (isHeld && !isSelected && !isBooked)}
                    onClick={() => handleSeatClick(seat.label, isBooked, isBlocked, isHeld, isSelected)}
                    title={
                      isBooked
                        ? `সিট: ${seat.label} (বুকড) - ক্লিক করে বুকিংয়ের তথ্য দেখুন`
                        : isHeld && !isSelected
                        ? `বুকিং প্রসেসিংয়ে (Holding) - ${heldInfo?.agentName || 'অন্য এজেন্ট'}`
                        : isBlocked
                        ? 'সিটটি ব্লকড (Blocked)'
                        : `সিট: ${seat.label} (${seat.type}) - বুকিংয়ের জন্য ক্লিক করুন`
                    }
                    className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl border flex flex-col items-center justify-center transition-all text-xs font-bold ${bgClass} ${
                      isSleeper ? 'h-14' : ''
                    }`}
                  >
                    <span>{seat.label}</span>

                    {/* Small status indicators */}
                    {statusBadge && (
                      <span className="absolute top-0.5 right-1 text-[9px] font-black opacity-90">
                        {statusBadge}
                      </span>
                    )}

                    {isVIP && !isBooked && !isSelected && !isHeld && (
                      <span className="text-[7px] sm:text-[8px] text-amber-400 font-bold tracking-tighter">
                        VIP
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend / Color Code Reference */}
      <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-800 border border-slate-700 shrink-0" />
          <span>ফাঁকা (Available)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400 shrink-0" />
          <span>সিলেক্ট করা (Selected)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-sky-950 border border-sky-700 text-sky-400 text-center font-bold text-[9px] flex items-center justify-center shrink-0">
            ♂
          </div>
          <span>বুকড (পুরুষ / Male)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-pink-950 border border-pink-700 text-pink-400 text-center font-bold text-[9px] flex items-center justify-center shrink-0">
            ♀
          </div>
          <span>বুকড (নারী / Female)</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-slate-800/80">
          <div className="w-3 h-3 rounded bg-amber-950 border border-amber-500 text-amber-300 text-center font-bold text-[9px] animate-pulse flex items-center justify-center shrink-0">
            ⏳
          </div>
          <span className="text-amber-300 font-semibold text-[10px]">অন্য এজেন্টের সিলেক্টেড সিট (রিয়েল-টাইম)</span>
        </div>
        <div className="col-span-2 text-[10px] text-slate-400 italic text-center pt-1">
          💡 বুকড সিটে ক্লিক করলে বুকিংকারীর বিস্তারিত তথ্য দেখা যাবে
        </div>
      </div>

      {/* Booked Seat Details Popup Modal with Close Cross Button */}
      {inspectedSeat && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setInspectedSeat(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Close Cross Button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white">
                      সিট <span className="text-emerald-400 font-mono text-base">{inspectedSeat.seatLabel}</span> এর বুকিং তথ্য
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400">বুকিংকারী ও যাত্রীর বিস্তারিত বিবরণ</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setInspectedSeat(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-sm"
                title="পপআপ বন্ধ করুন (Close)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {inspectedSeat.booking ? (
              <div className="space-y-3.5 text-xs">
                {/* Booking ID & Status Bar */}
                <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">বুকিং আইডি</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                      {inspectedSeat.booking.id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">পেমেন্ট স্ট্যাটাস</span>
                    <span
                      className={`font-black text-[11px] px-2.5 py-0.5 rounded-full inline-block border ${
                        inspectedSeat.booking.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : inspectedSeat.booking.paymentStatus === 'Partial'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {inspectedSeat.booking.paymentStatus === 'Paid'
                        ? 'পরিশোধিত (Paid)'
                        : inspectedSeat.booking.paymentStatus === 'Partial'
                        ? 'আংশিক পরিশোধ'
                        : 'অপরিশোধিত'}
                    </span>
                  </div>
                </div>

                {/* Primary Customer Details */}
                <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                    ১. প্রধান বুকিংকারীর তথ্য
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200">
                    <div>
                      <span className="text-slate-400 text-[11px] block">নাম:</span>
                      <span className="font-bold text-white text-xs">
                        {inspectedSeat.booking.customerName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">মোবাইল নম্বর:</span>
                      <a
                        href={`tel:${inspectedSeat.booking.customerPhone}`}
                        className="font-bold text-emerald-400 hover:underline flex items-center gap-1 text-xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{inspectedSeat.booking.customerPhone}</span>
                      </a>
                    </div>
                    {inspectedSeat.booking.customerAltPhone && (
                      <div>
                        <span className="text-slate-400 text-[11px] block">বিকল্প মোবাইল:</span>
                        <span className="font-semibold text-slate-300">
                          {inspectedSeat.booking.customerAltPhone}
                        </span>
                      </div>
                    )}
                    {inspectedSeat.booking.customerAddress && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 text-[11px] block">ঠিকানা:</span>
                        <span className="text-slate-300 text-[11px]">
                          {inspectedSeat.booking.customerAddress}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specific Passenger Assigned to this Seat */}
                <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
                    ২. এই সিটের ({inspectedSeat.seatLabel}) নির্ধারিত যাত্রী
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-slate-200">
                    <div>
                      <span className="text-slate-400 text-[11px] block">যাত্রীর নাম:</span>
                      <span className="font-bold text-white">
                        {inspectedSeat.passenger?.name || inspectedSeat.booking.customerName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">লিঙ্গ ও ধর্ম:</span>
                      <span className="font-semibold text-slate-200">
                        {inspectedSeat.passenger?.gender === 'Female' ? '♀ নারী' : '♂ পুরুষ'} ({inspectedSeat.passenger?.religion || inspectedSeat.booking.customerReligion || 'Islam'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">গ্রুপ টাইপ:</span>
                      <span className="font-semibold text-purple-300">
                        {inspectedSeat.booking.groupType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">বুককৃত মোট সিট:</span>
                      <span className="font-bold text-emerald-400">
                        {inspectedSeat.booking.selectedSeats.join(', ')} ({inspectedSeat.booking.passengerCount} টি)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booker / Agent & Financial info */}
                <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
                    ৩. এজেন্ট ও আর্থিক বিবরণ
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-slate-200">
                    <div>
                      <span className="text-slate-400 text-[11px] block">বুকিং এজেন্ট:</span>
                      <span className="font-bold text-white text-xs">
                        {inspectedSeat.booking.agentName || inspectedSeat.booking.bookerCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">বুকিংয়ের সময়:</span>
                      <span className="text-slate-300 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(inspectedSeat.booking.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(inspectedSeat.booking.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">মোট পেয়েবল:</span>
                      <span className="font-black text-emerald-400">
                        ৳{inspectedSeat.booking.payableAmount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">বকেয়া (Due):</span>
                      <span className="font-bold text-rose-400">
                        ৳{inspectedSeat.booking.dueAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 text-center space-y-2">
                <Info className="w-8 h-8 text-sky-400 mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">
                  সিটটি বুকড করা আছে
                </p>
                {inspectedSeat.genderInfo && (
                  <p className="text-xs text-slate-400">
                    যাত্রী: <strong className="text-white">{inspectedSeat.genderInfo.passengerName}</strong> ({inspectedSeat.genderInfo.gender})
                  </p>
                )}
              </div>
            )}

            {/* Modal Footer Close Action */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedSeat(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>বন্ধ করুন (Close)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


