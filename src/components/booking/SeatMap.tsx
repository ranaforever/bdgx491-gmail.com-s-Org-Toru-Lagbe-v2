import React from 'react';
import { BusLayoutTemplate } from '../../types';

interface SeatMapProps {
  layout: BusLayoutTemplate;
  bookedSeats: Set<string>;
  seatGenderMap?: Record<string, { gender: string; religion: string; passengerName: string }>;
  selectedSeats: string[];
  onToggleSeat?: (seatLabel: string) => void;
  interactive?: boolean;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  layout,
  bookedSeats,
  seatGenderMap = {},
  selectedSeats,
  onToggleSeat,
  interactive = true,
}) => {
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl max-w-sm mx-auto select-none">
      {/* Bus Front Section */}
      <div className="border-b-2 border-dashed border-slate-700 pb-4 mb-6 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{layout.busType} BUS</span>
        </div>

        {/* Driver Wheel Icon */}
        <div className="flex items-center gap-2 bg-slate-800 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold">
          <span>ড্রাইভার (Driver)</span>
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-200">
            🚌
          </div>
        </div>
      </div>

      {/* Seating Grid Canvas */}
      <div className="space-y-3">
        {sortedRows.map((rowNum) => {
          const rowSeats = rowMap[rowNum].sort((a, b) => a.col - b.col);
          return (
            <div key={`row-${rowNum}`} className="flex items-center justify-center gap-2.5">
              {rowSeats.map((seat) => {
                // Empty Aisle space
                if (seat.type === 'Empty') {
                  return <div key={seat.id} className="w-10 h-10 shrink-0" />;
                }

                const isBooked = bookedSeats.has(seat.label);
                const isSelected = selectedSeats.includes(seat.label);
                const isBlocked = seat.isBlocked || seat.type === 'Blocked';
                const passengerInfo = seatGenderMap[seat.label];

                // Determine seat color theme
                let bgClass = 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-emerald-500/20 hover:border-emerald-500';
                let statusBadge = '';

                if (isBlocked) {
                  bgClass = 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50';
                } else if (isBooked) {
                  if (passengerInfo?.gender === 'Female') {
                    bgClass = 'bg-pink-950/80 border-pink-700/80 text-pink-300 font-bold cursor-not-allowed shadow-inner';
                    statusBadge = '♀';
                  } else if (passengerInfo?.gender === 'Male') {
                    bgClass = 'bg-sky-950/80 border-sky-700/80 text-sky-300 font-bold cursor-not-allowed shadow-inner';
                    statusBadge = '♂';
                  } else {
                    bgClass = 'bg-rose-950/80 border-rose-700/80 text-rose-300 font-bold cursor-not-allowed shadow-inner';
                  }
                } else if (isSelected) {
                  bgClass = 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 scale-105';
                }

                // Special type styling
                const isSleeper = seat.type === 'Sleeper';
                const isVIP = seat.type === 'VIP';

                return (
                  <button
                    key={seat.id}
                    disabled={!interactive || isBooked || isBlocked}
                    onClick={() => onToggleSeat && onToggleSeat(seat.label)}
                    title={
                      isBooked
                        ? `বুকড - ${passengerInfo?.passengerName || 'Passenger'} (${passengerInfo?.gender || ''})`
                        : isBlocked
                        ? 'সিটটি ব্লকড (Blocked)'
                        : `সিট: ${seat.label} (${seat.type})`
                    }
                    className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex flex-col items-center justify-center transition-all text-xs font-bold ${bgClass} ${
                      isSleeper ? 'h-14' : ''
                    }`}
                  >
                    <span>{seat.label}</span>

                    {/* Small status indicators */}
                    {statusBadge && (
                      <span className="absolute top-0.5 right-1 text-[9px] font-black opacity-80">
                        {statusBadge}
                      </span>
                    )}

                    {isVIP && !isBooked && !isSelected && (
                      <span className="text-[8px] text-amber-400 font-bold tracking-tighter">
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
      <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
          <span>ফাঁকা (Available)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-400" />
          <span>সিলেক্ট করা (Selected)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-sky-950 border border-sky-700 text-sky-400 text-center font-bold text-[9px]">
            ♂
          </div>
          <span>বুকড (পুরুষ / Male)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-pink-950 border border-pink-700 text-pink-400 text-center font-bold text-[9px]">
            ♀
          </div>
          <span>বুকড (নারী / Female)</span>
        </div>
      </div>
    </div>
  );
};
