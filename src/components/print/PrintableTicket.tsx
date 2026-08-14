import React, { useState } from 'react';
import { Booking } from '../../types';
import { StorageService } from '../../services/storage';
import { CalculationUtils } from '../../utils/calculations';
import { ExportUtils } from '../../utils/pdfExport';
import {
  Printer,
  X,
  Ticket,
  Utensils,
  Grid,
  Maximize2,
  FileText,
  CheckCircle2,
  Smartphone,
  MapPin,
} from 'lucide-react';

interface PrintableTicketProps {
  booking: Booking;
  onClose: () => void;
}

type PrintMode = 'ticket' | 'food-tokens' | 'all-a4';
type LayoutSize = 'thermal-80' | 'a4-single' | 'a4-double' | 'a4-quad' | 'token-grid';

export const PrintableTicket: React.FC<PrintableTicketProps> = ({ booking, onClose }) => {
  const settings = StorageService.getSettings();
  const ps = settings.printSettings;
  const tours = StorageService.getTours();
  const currentTour = tours.find((t) => t.id === booking.tourId);
  const hotels = StorageService.getHotels();

  // Room assignment details
  const assignedRoomsInfo: { hotelName: string; roomNumber: string; passengerName: string; roomType: string }[] = [];
  const assignedRoomsMap: Record<string, string> = {};

  hotels.forEach((hotel) => {
    hotel.rooms?.forEach((room) => {
      booking.passengers.forEach((psg) => {
        if (room.assignedPassengerIds?.includes(psg.id)) {
          const roomStr = `${hotel.name} (রুম: ${room.roomNumber})`;
          assignedRoomsMap[psg.id] = roomStr;
          assignedRoomsInfo.push({
            hotelName: hotel.name,
            roomNumber: room.roomNumber,
            passengerName: psg.name || booking.customerName,
            roomType: room.roomType,
          });
        }
      });
    });
  });

  const [printMode, setPrintMode] = useState<PrintMode>('ticket');
  const [layoutSize, setLayoutSize] = useState<LayoutSize>('a4-single');

  // Food meal checkboxes
  const [selectedMeals, setSelectedMeals] = useState<string[]>([
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snacks',
  ]);

  const mealLabels: Record<string, string> = {
    Breakfast: 'সকালের নাস্তা (Breakfast)',
    Lunch: 'দুপুরের খাবার (Lunch)',
    Dinner: 'রাতের খাবার (Dinner)',
    Snacks: 'বিকেলের স্ন্যাক্স (Snacks)',
    Special: 'বিশেষ খাবার (Special Meal)',
  };

  const toggleMeal = (mealKey: string) => {
    if (selectedMeals.includes(mealKey)) {
      setSelectedMeals(selectedMeals.filter((m) => m !== mealKey));
    } else {
      setSelectedMeals([...selectedMeals, mealKey]);
    }
  };

  const handlePrint = () => {
    ExportUtils.triggerPrint();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
            <div>
              <h2 className="text-base font-bold text-white">টিকিট ও খাবার টোকেন প্রিন্ট সেন্টার</h2>
              <p className="text-[11px] text-slate-400">
                বুকিং ID: <span className="text-emerald-400 font-bold">{booking.id}</span> | পছন্দমতো সাইজ কাস্টমাইজ করে প্রিন্ট নিন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন (Print Now)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Options Bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs print:hidden">
          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">১. প্রিন্ট মোড নির্বাচন করুন:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrintMode('ticket');
                  if (layoutSize === 'token-grid') setLayoutSize('a4-single');
                }}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  printMode === 'ticket'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>বাস টিকিট</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPrintMode('food-tokens');
                  setLayoutSize('token-grid');
                }}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  printMode === 'food-tokens'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>খাবার টোকেন</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPrintMode('all-a4');
                  setLayoutSize('a4-double');
                }}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  printMode === 'all-a4'
                    ? 'bg-teal-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>টিকিট + টোকেন</span>
              </button>
            </div>
          </div>

          {/* Paper Size Selector */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">২. পেপার ও কাস্টম সাইজ:</label>
            <select
              value={layoutSize}
              onChange={(e) => setLayoutSize(e.target.value as LayoutSize)}
              className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="a4-single">A4 Full Page (১টি টিকিট প্রতি পেজ)</option>
              <option value="a4-double">A4 2-in-1 Page (২টি টিকিট বা টোকেন প্রতি পেজ)</option>
              <option value="a4-quad">A4 4-in-1 Page (৪টি প্যানেল প্রতি পেজ)</option>
              <option value="token-grid">খাবারের টোকেন গ্রিড (A4 পেজে ৮টি টোকেন)</option>
              <option value="thermal-80">থার্মাল রিসিট সাইজ (80mm Thermal Paper)</option>
            </select>
          </div>

          {/* Food Meals Filter Checkboxes if in food or all-a4 mode */}
          {(printMode === 'food-tokens' || printMode === 'all-a4') && (
            <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-amber-400 font-bold">খাবারের আইটেম বেছে নিন:</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(mealLabels).map((mealKey) => {
                  const isChecked = selectedMeals.includes(mealKey);
                  return (
                    <button
                      key={mealKey}
                      type="button"
                      onClick={() => toggleMeal(mealKey)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all ${
                        isChecked
                          ? 'bg-amber-500 text-slate-950 border border-amber-400'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isChecked ? 'text-slate-950' : 'text-slate-500'}`} />
                      <span>{mealLabels[mealKey]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Printable View Container */}
        <div id="printable-area" className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 overflow-x-auto flex flex-col items-center print:p-0 print:border-none print:bg-white print:overflow-visible">
          
          {/* 1. BUS TICKET SECTION */}
          {(printMode === 'ticket' || printMode === 'all-a4') && (
            <div
              className={`bg-white text-black font-sans rounded-2xl shadow-xl border border-gray-300 p-6 space-y-4 max-w-full my-3 print:border-black print:shadow-none ${
                layoutSize === 'thermal-80' ? 'w-[80mm]' : layoutSize === 'a4-double' ? 'w-[180mm]' : 'w-[210mm]'
              }`}
            >
              {/* Ticket Brand Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  <img src="/logo.svg" alt="Tour লাগবে Logo" className="h-10 w-auto object-contain" />
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{settings.businessName}</h1>
                    <p className="text-[11px] text-slate-600 font-semibold">{settings.tagline}</p>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-600 font-medium">
                  <p className="font-bold text-slate-900">হটলাইন: {settings.phone}</p>
                  <p>{settings.address}</p>
                </div>
              </div>

              {/* Grid Details - Larger Fonts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-sm border-b border-gray-300 pb-3">
                <div>
                  <span className="text-gray-500 block text-xs">বুকিং আইডি (Booking ID):</span>
                  <strong className="text-base font-black text-emerald-800">{booking.id}</strong>
                </div>

                <div>
                  <span className="text-gray-500 block text-xs">প্রধান গ্রাহকের নাম:</span>
                  <strong className="text-sm font-black text-gray-900">{booking.customerName}</strong>
                </div>

                <div>
                  <span className="text-gray-500 block text-xs">মোবাইল নম্বর:</span>
                  <strong className="text-sm font-bold font-mono text-gray-900">{booking.customerPhone}</strong>
                </div>

                {booking.customerAltPhone && (
                  <div>
                    <span className="text-gray-500 block text-xs">বিকল্প মোবাইল:</span>
                    <strong className="text-sm font-bold font-mono text-gray-900">{booking.customerAltPhone}</strong>
                  </div>
                )}

                {booking.customerAddress && (
                  <div className="col-span-2">
                    <span className="text-gray-500 block text-xs">ঠিকানা:</span>
                    <strong className="text-xs font-semibold text-gray-800">{booking.customerAddress}</strong>
                  </div>
                )}

                <div>
                  <span className="text-gray-500 block text-xs">ট্যুর প্যাকেজ:</span>
                  <strong className="text-sm font-black text-slate-800">{currentTour?.name}</strong>
                </div>

                <div>
                  <span className="text-gray-500 block text-xs">যাত্রার তারিখ:</span>
                  <strong className="text-sm font-bold text-gray-900">{currentTour?.startDate}</strong>
                </div>

                <div>
                  <span className="text-gray-500 block text-xs">বুকিং এজেন্ট:</span>
                  <strong className="text-sm font-black text-teal-800">{booking.agentName || booking.bookerCode}</strong>
                </div>
              </div>

              {/* Seats & Passengers Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 p-3 rounded-xl font-bold text-sm">
                  <span className="text-slate-900 font-extrabold">বরাদ্দকৃত সিট নম্বর (Seats):</span>
                  <span className="text-emerald-950 font-black text-lg tracking-widest bg-white px-3.5 py-1 rounded-lg border border-emerald-400 shadow-sm">
                    {booking.selectedSeats.join(', ')}
                  </span>
                </div>

                <div className="border border-gray-300 rounded-xl p-3 text-xs space-y-1.5">
                  <span className="font-extrabold text-gray-900 block border-b pb-1 text-xs uppercase">
                    যাত্রীদের তালিকা (Passengers Details):
                  </span>
                  {booking.passengers.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between py-1 border-b border-gray-100 text-xs">
                      <span>
                        {idx + 1}. <strong className="text-gray-900">{p.name || booking.customerName}</strong> ({p.gender === 'Male' ? 'পুরুষ' : 'নারী'})
                      </span>
                      <span className="bg-gray-100 font-black text-slate-900 px-2.5 py-0.5 rounded border border-gray-300">
                        সিট: {p.seatNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hotel & Room Assignment Details Section */}
              {currentTour?.tourCategory === 'Day Long' ? (
                <div className="border border-amber-300 bg-amber-50 rounded-xl p-3 text-xs space-y-1">
                  <span className="font-black text-amber-950 block border-b border-amber-200 pb-1 text-xs flex items-center justify-between">
                    <span>☀️ ডে-লং ট্যুর (Day Long Tour):</span>
                    <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[10px] font-bold">
                      হোটেল প্রযোজ্য নয়
                    </span>
                  </span>
                  <span className="text-amber-900 font-medium block py-0.5 text-[11px]">
                    এটি ১ দিনের ডে-লং ট্যুর। কোনো হোটেল বা রাত্রিকালীন রুম বরাদ্দের প্রয়োজন নেই।
                  </span>
                </div>
              ) : (
                <div className="border-2 border-amber-300 bg-amber-50/80 rounded-xl p-3 text-xs space-y-1.5">
                  <span className="font-black text-amber-950 block border-b border-amber-200 pb-1 text-xs flex items-center justify-between">
                    <span>🏨 হোটেল ও রুম অ্যাসাইনমেন্ট (Hotel Room Assignment):</span>
                    <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[10px] font-bold">
                      {assignedRoomsInfo.length} টি রুম
                    </span>
                  </span>
                  {assignedRoomsInfo.length === 0 ? (
                    <span className="text-gray-600 italic block py-0.5 text-[11px]">
                      হোটেল রুম বরাদ্দ প্রক্রিয়া সাপেক্ষে (রুমে এন্ট্রি করতে হোটেল অ্যাসাইনমেন্ট দেখুন)।
                    </span>
                  ) : (
                    assignedRoomsInfo.map((info, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-amber-200/60 last:border-none text-xs">
                        <span>
                          <strong>{info.hotelName}</strong> ({info.roomType})
                        </span>
                        <span className="bg-amber-200/90 text-amber-950 font-black px-2.5 py-0.5 rounded border border-amber-300">
                          রুম নম্বর: {info.roomNumber} ({info.passengerName})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Financial Calculation Box */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-300 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">মোট প্যাকেজ ফি:</span>
                  <span className="font-bold">{CalculationUtils.formatCurrency(booking.totalFee)}</span>
                </div>
                {booking.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>বিশেষ ছাড়:</span>
                    <span>- {CalculationUtils.formatCurrency(booking.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-gray-200 pt-1.5 text-sm">
                  <span className="text-gray-800">পরিশোধযোগ্য মূল্য:</span>
                  <strong className="text-base font-black text-slate-900">{CalculationUtils.formatCurrency(booking.payableAmount)}</strong>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold text-xs">
                  <span>অ্যাডভান্স জমা:</span>
                  <span className="font-black">{CalculationUtils.formatCurrency(booking.advanceAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-black border-t border-dashed border-gray-300 pt-1 text-sm">
                  <span>বকেয়া পরিমাণ (Due Amount):</span>
                  <span className="text-base">{CalculationUtils.formatCurrency(booking.dueAmount)}</span>
                </div>
              </div>

              {/* Footer Guidelines */}
              <div className="text-[9px] text-gray-500 pt-2 border-t border-gray-200 leading-tight flex justify-between items-end">
                <div>
                  <p>* বাস ছাড়ার ২০ মিনিট পূর্বে কাউন্টারে উপস্থিত থাকুন।</p>
                  <p>* ভ্রমণের সময় এই টিকিট ও টোকেন সাথে রাখুন।</p>
                </div>
                <div className="text-right font-mono font-bold text-slate-400">
                  নিরাপদ ভ্রমণের শুভকামনা
                </div>
              </div>
            </div>
          )}

          {/* 2. FOOD TOKENS SECTION */}
          {(printMode === 'food-tokens' || printMode === 'all-a4') && (
            <div className="w-full my-4 space-y-3">
              <div className="text-center print:hidden border-b border-slate-800 pb-2">
                <span className="bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase">
                  খাবারের টোকেনসমূহ ({booking.passengers.length} জন যাত্রী × {selectedMeals.length} টি মিল)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                {booking.passengers.flatMap((psg) =>
                  selectedMeals.map((meal) => (
                    <div
                      key={`${psg.id}-${meal}`}
                      className="bg-white text-black font-sans rounded-xl border-2 border-dashed border-gray-400 p-3 space-y-2 text-xs relative overflow-hidden print:border-black print:break-inside-avoid"
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between border-b border-gray-300 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <img src="/logo.svg" alt="Logo" className="h-5 w-auto" />
                          <span className="font-black text-[11px] uppercase text-slate-900">{settings.businessName}</span>
                        </div>
                        <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                          {mealLabels[meal] || meal}
                        </span>
                      </div>

                      {/* Passenger & Seat Details */}
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div>
                          <span className="text-gray-500 text-[9px] block">যাত্রীর নাম:</span>
                          <strong className="text-slate-900 font-bold truncate block">
                            {psg.name || booking.customerName}
                          </strong>
                        </div>

                        <div>
                          <span className="text-gray-500 text-[9px] block">সিট নম্বর:</span>
                          <strong className="text-emerald-800 font-black text-sm block">
                            {psg.seatNumber}
                          </strong>
                        </div>

                        <div>
                          <span className="text-gray-500 text-[9px] block">বুকিং ID:</span>
                          <span className="font-mono font-bold text-[10px] text-slate-700">{booking.id}</span>
                        </div>

                        <div>
                          <span className="text-gray-500 text-[9px] block">ট্যুর:</span>
                          <span className="font-bold text-[10px] text-slate-800 truncate block">{currentTour?.name}</span>
                        </div>
                      </div>

                      {/* Hotel & Room Assigned */}
                      <div className="flex justify-between items-center bg-amber-50 px-2 py-1 rounded border border-amber-300 text-[10px] font-bold text-amber-950">
                        <span>🏨 হোটেল ও রুম:</span>
                        <span className="font-black text-amber-900 truncate max-w-[120px]">
                          {assignedRoomsMap[psg.id] || 'অ্যাসাইনমেন্ট অপেক্ষমাণ'}
                        </span>
                      </div>

                      {/* Footer Stamp */}
                      <div className="border-t border-gray-200 pt-1 text-[8px] text-gray-500 flex justify-between items-center">
                        <span>* কেবল নির্ধারিত মিলের জন্য প্রযোজ্য</span>
                        <span className="font-bold text-slate-800">Tour লাগবে HQ</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
