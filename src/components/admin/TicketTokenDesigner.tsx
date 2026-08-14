import React, { useState } from 'react';
import { PrintSettings, TicketUnit, Booking, Tour, Agent } from '../../types';
import { StorageService } from '../../services/storage';
import { CalculationUtils } from '../../utils/calculations';
import { ExportUtils } from '../../utils/pdfExport';
import {
  Printer,
  Save,
  CheckCircle2,
  Ticket,
  Utensils,
  Search,
  Sliders,
  Filter,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';

interface TicketTokenDesignerProps {
  onClose?: () => void;
}

export const TicketTokenDesigner: React.FC<TicketTokenDesignerProps> = ({ onClose }) => {
  const [settings, setSettings] = useState(StorageService.getSettings());
  const [ps, setPs] = useState<PrintSettings>(settings.printSettings);
  const [saveSuccess, setSaveSuccess] = useState('');

  const [activeTab, setActiveTab] = useState<'tickets-a4' | 'tokens-a4' | 'settings'>('tickets-a4');

  // Load Data
  const bookings = StorageService.getBookings();
  const tours = StorageService.getTours();
  const agents = StorageService.getAgents();
  const hotels = StorageService.getHotels();

  // Helper for booking summary hotel & room info
  const getBookingHotelSummary = (b: Booking) => {
    const tour = tours.find((t) => t.id === b.tourId);
    if (tour?.tourCategory === 'Day Long') {
      return 'N/A (Day Long Tour)';
    }
    const assigned: string[] = [];
    const psgIds = b.passengers.map((p) => p.id);
    hotels.forEach((h) => {
      h.rooms?.forEach((r) => {
        if (r.assignedPassengerIds?.some((id) => psgIds.includes(id))) {
          assigned.push(`${h.name} (${r.roomNumber})`);
        }
      });
    });
    return assigned.length > 0 ? assigned.join(', ') : 'অ্যাসাইনমেন্ট অপেক্ষমাণ';
  };

  // --- TAB 1: TICKET PRINT FILTERS ---
  const [ticketPassengerQuery, setTicketPassengerQuery] = useState('');
  const [ticketBusFilter, setTicketBusFilter] = useState('ALL');
  const [ticketTourFilter, setTicketTourFilter] = useState('ALL');
  const [ticketAgentFilter, setTicketAgentFilter] = useState('ALL');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>(
    bookings.map((b) => b.id)
  );

  // --- TAB 2: FOOD TOKEN PRINT FILTERS & MENU ---
  const [tokenBusFilter, setTokenBusFilter] = useState('ALL');
  const [tokenTourFilter, setTokenTourFilter] = useState('ALL');
  const [tokenAgentFilter, setTokenAgentFilter] = useState('ALL');
  const [selectedMealType, setSelectedMealType] = useState<
    'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Special'
  >('Breakfast');

  // Custom Editable Menus for Meals
  const [mealMenus, setMealMenus] = useState<Record<string, string>>({
    Breakfast: 'পরোটা, ডিম ভাজি, ডাল/সবজি, স্পেশাল চা',
    Lunch: 'প্লেইন রাইস/ভাত, দেশি চিকেন ভুনা, স্পেশাল ডাল, সালাদ',
    Dinner: 'চিকেন বিরিয়ানি, বোরহানি/কোল্ড ড্রিংকস, ফিরনি',
    Snacks: 'চিকেন সামুচা/সিঙ্গারা, কেক, মসলা চা',
    Special: 'স্পেশাল বুফে খাবার ও ডেজার্ট',
  });

  // Custom Extra Note Box heading
  const [extraNoteBoxTitle, setExtraNoteBoxTitle] = useState(
    'প্যাকেজের বাইরে অতিরিক্ত খাবার (Extra Items):'
  );

  // Meal Labels Bengali Mapping
  const mealLabels: Record<string, string> = {
    Breakfast: 'সকালের নাস্তা (Breakfast)',
    Lunch: 'দুপুরের খাবার (Lunch)',
    Dinner: 'রাতের খাবার (Dinner)',
    Snacks: 'বিকেলের স্ন্যাক্স (Snacks)',
    Special: 'বিশেষ খাবার (Special Meal)',
  };

  // Unique Bus Types
  const uniqueBusTypes = Array.from(
    new Set(tours.map((t) => t.busType).filter(Boolean))
  );

  // Filter Bookings for Ticket Printing
  const filteredTicketBookings = bookings.filter((b) => {
    const currentTour = tours.find((t) => t.id === b.tourId);
    
    // Passenger Name match
    const passengerMatch =
      !ticketPassengerQuery ||
      b.customerName.toLowerCase().includes(ticketPassengerQuery.toLowerCase()) ||
      b.passengers.some((p) => p.name.toLowerCase().includes(ticketPassengerQuery.toLowerCase()));

    // Bus filter match
    const busMatch =
      ticketBusFilter === 'ALL' ||
      (currentTour && currentTour.busType === ticketBusFilter);

    // Tour filter match
    const tourMatch = ticketTourFilter === 'ALL' || b.tourId === ticketTourFilter;

    // Agent filter match
    const agentMatch =
      ticketAgentFilter === 'ALL' ||
      b.agentName === ticketAgentFilter ||
      b.bookerCode === ticketAgentFilter;

    return passengerMatch && busMatch && tourMatch && agentMatch;
  });

  // Toggle Ticket Selection
  const toggleTicketSelect = (id: string) => {
    if (selectedTicketIds.includes(id)) {
      setSelectedTicketIds(selectedTicketIds.filter((item) => item !== id));
    } else {
      setSelectedTicketIds([...selectedTicketIds, id]);
    }
  };

  const handleSelectAllTickets = () => {
    if (selectedTicketIds.length === filteredTicketBookings.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredTicketBookings.map((b) => b.id));
    }
  };

  // Filter Bookings for Token Printing
  const filteredTokenBookings = bookings.filter((b) => {
    const currentTour = tours.find((t) => t.id === b.tourId);

    const busMatch =
      tokenBusFilter === 'ALL' ||
      (currentTour && currentTour.busType === tokenBusFilter);

    const tourMatch = tokenTourFilter === 'ALL' || b.tourId === tokenTourFilter;

    const agentMatch =
      tokenAgentFilter === 'ALL' ||
      b.agentName === tokenAgentFilter ||
      b.bookerCode === tokenAgentFilter;

    return busMatch && tourMatch && agentMatch;
  });

  // Generate individual Seat Tokens
  const seatTokens = filteredTokenBookings.flatMap((b) => {
    const currentTour = tours.find((t) => t.id === b.tourId);
    return b.selectedSeats.map((seatNum) => {
      const psg = b.passengers.find((p) => p.seatNumber === seatNum);

      let hotelRoomStr = 'অ্যাসাইনমেন্ট অপেক্ষমাণ';
      if (psg) {
        hotels.forEach((h) => {
          h.rooms?.forEach((r) => {
            if (r.assignedPassengerIds?.includes(psg.id)) {
              hotelRoomStr = `${h.name} - রুম: ${r.roomNumber}`;
            }
          });
        });
      }

      return {
        tokenId: `${b.id}-${seatNum}`,
        bookingId: b.id,
        passengerName: psg?.name || b.customerName,
        seatNumber: seatNum,
        tourName: currentTour?.name || 'Tour Package',
        busName: currentTour ? `${currentTour.busType} Bus` : 'Standard Bus',
        agentName: b.agentName || b.bookerCode || 'HQ Direct',
        phone: b.customerPhone,
        hotelInfo: hotelRoomStr,
      };
    });
  });

  // Save Size Settings
  const handleSaveSettings = () => {
    const newSettings = { ...settings, printSettings: ps };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    setSaveSuccess('টিকিট ও টোকেন সাইজ সেটিংস সংরক্ষিত হয়েছে!');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  // Trigger Print
  const handlePrint = () => {
    ExportUtils.triggerPrint();
  };

  // Helper chunk array into pages
  const chunkArray = <T,>(arr: T[], chunkSize: number): T[][] => {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      res.push(arr.slice(i, i + chunkSize));
    }
    return res;
  };

  const selectedBookingsToPrint = filteredTicketBookings.filter((b) =>
    selectedTicketIds.includes(b.id)
  );

  // 6 tickets per A4 page
  const ticketPages = chunkArray(selectedBookingsToPrint, 6);

  // 10 tokens per A4 page
  const tokenPages = chunkArray(seatTokens, 10);

  return (
    <div className="space-y-6">
      {/* Top Banner Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            স্মার্ট বাল্ক প্রিন্টিং হাব
          </span>
          <h1 className="text-xl font-black text-white mt-1">
            টিকিট ও খাবার টোকেন প্রিন্টিং প্যানেল (A4 Grid Center)
          </h1>
          <p className="text-xs text-slate-400">
            ফিল্টার অনুযায়ী A4 পেজে ৬টি টিকিট (2×3) অথবা ১০টি খাবার টোকেন (2×5) একবারে প্রিন্ট করুন
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(activeTab === 'tickets-a4' || activeTab === 'tokens-a4') && (
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>A4 পেজ প্রিন্ট দিন (Print Now)</span>
            </button>
          )}

          {activeTab === 'settings' && (
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>সেটিংস সেভ করুন</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="ট্যাব বন্ধ করুন (Close Tab)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">বন্ধ করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-2 no-print items-center">
        <div className="flex-1 flex gap-2">
          <button
            onClick={() => setActiveTab('tickets-a4')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tickets-a4'
                ? 'bg-emerald-500 text-slate-950 shadow-lg font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>১. A4 বাস টিকিট প্রিন্ট (৬টি / পেজ)</span>
          </button>

          <button
            onClick={() => setActiveTab('tokens-a4')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tokens-a4'
                ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>২. A4 খাবার টোকেন প্রিন্ট (১০টি / পেজ)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-teal-500 text-slate-950 shadow-lg font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>প্রিন্ট মেজারমেন্ট সেটিংস</span>
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-3 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-xl transition-all cursor-pointer shrink-0"
            title="ট্যাব ক্রস / বন্ধ করুন (Close Tab)"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: A4 BUS TICKET PRINT CENTER (6 TICKETS PER PAGE: 2 COLS x 3 ROWS) */}
      {/* ==================================================================== */}
      {activeTab === 'tickets-a4' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 no-print shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-4 h-4" />
                <span>টিকিট ফিল্টার অপশনসমূহ</span>
              </span>
              <span className="text-xs text-slate-400 font-bold">
                মোট ফিল্টারকৃত বুকিং: <strong className="text-white">{filteredTicketBookings.length}</strong> টি | নির্বাচিত: <strong className="text-emerald-400">{selectedTicketIds.length}</strong> টি
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Passenger Search */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  যাত্রীর নাম (Passenger Name):
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="নাম লিখে খুঁজুন..."
                    value={ticketPassengerQuery}
                    onChange={(e) => setTicketPassengerQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 2. Bus Name / Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  বাসের নাম/টাইপ (Bus Type):
                </label>
                <select
                  value={ticketBusFilter}
                  onChange={(e) => setTicketBusFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">সকল বাস (All Buses)</option>
                  {uniqueBusTypes.map((bus) => (
                    <option key={bus} value={bus}>
                      {bus} Bus
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Tour Package */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ট্যুর প্যাকেজ (Tour Name):
                </label>
                <select
                  value={ticketTourFilter}
                  onChange={(e) => setTicketTourFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">সকল ট্যুর (All Tours)</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Agent / Booker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  এজেন্ট বুকিং (Agent / Booker):
                </label>
                <select
                  value={ticketAgentFilter}
                  onChange={(e) => setTicketAgentFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">সকল এজেন্ট (All Agents)</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.agencyName}>
                      {ag.agencyName} ({ag.name})
                    </option>
                  ))}
                  <option value="HQ Direct">HQ Direct</option>
                </select>
              </div>
            </div>

            {/* Select All Checkbox */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSelectAllTickets}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
              >
                {selectedTicketIds.length === filteredTicketBookings.length ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>সব সিলেক্ট / ডিসিলেক্ট করুন (Select / Deselect All)</span>
              </button>

              <span className="text-[11px] text-slate-400">
                প্রিন্ট হবে মোট: <strong className="text-white">{ticketPages.length}</strong> টি A4 পেজ
              </span>
            </div>
          </div>

          {/* PRINTABLE A4 TICKET PAGES CONTAINER */}
          <div id="printable-area" className="space-y-8 flex flex-col items-center">
            {ticketPages.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 no-print">
                <Ticket className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                <p className="font-bold">কোনো টিকিট পাওয়া যায়নি</p>
                <p className="text-xs mt-1">অনুগ্রহ করে ফিল্টার পরিবর্তন করুন</p>
              </div>
            ) : (
              ticketPages.map((pageBookings, pageIdx) => (
                <div key={`ticket-page-${pageIdx}`} className="a4-page-wrapper no-print-wrapper">
                  <div className="text-center text-xs font-bold text-slate-400 mb-2 no-print">
                    --- A4 পেজ নম্বর: {pageIdx + 1} / {ticketPages.length} (৬টি টিকিট) ---
                  </div>

                  {/* A4 Sheet Container: Exactly 2 Columns x 3 Rows */}
                  <div className="a4-page bg-white text-black font-sans border border-gray-300 shadow-2xl p-4 w-[210mm] min-h-[297mm] mx-auto grid grid-cols-2 grid-rows-3 gap-3 print:border-none print:shadow-none print:p-2 print:m-0">
                    {pageBookings.map((b) => {
                      const tour = tours.find((t) => t.id === b.tourId);
                      const isSelected = selectedTicketIds.includes(b.id);

                      return (
                        <div
                          key={b.id}
                          onClick={() => toggleTicketSelect(b.id)}
                          className={`border-2 rounded-xl p-2.5 space-y-1.5 text-[10px] relative transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/20'
                              : 'border-gray-300 bg-gray-50/50 opacity-50'
                          } print:border-black print:bg-white print:opacity-100`}
                        >
                          {/* Selection Badge for Screen */}
                          <div className="absolute top-2 right-2 no-print">
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </div>

                          {/* Ticket Header */}
                          <div className="flex items-center justify-between border-b border-gray-300 pb-1">
                            <div className="flex items-center gap-1.5">
                              <img src="/logo.svg" alt="Logo" className="h-5 w-auto" />
                              <div>
                                <h2 className="font-black text-[11px] uppercase tracking-tight text-slate-900 leading-none">
                                  {settings.businessName}
                                </h2>
                                <span className="text-[8px] text-gray-600">{settings.phone}</span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-[9px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                              {b.id}
                            </span>
                          </div>

                          {/* Tour & Bus Info */}
                          <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1.5 rounded-lg text-[9px]">
                            <div>
                              <span className="text-gray-500 block text-[8px]">ট্যুর প্যাকেজ:</span>
                              <strong className="text-slate-900 truncate block font-bold">
                                {tour?.name || 'ট্যুর প্যাকেজ'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-[8px]">বাসের টাইপ:</span>
                              <strong className="text-slate-900 truncate block font-bold">
                                {tour ? `${tour.busType} Bus` : 'Standard Bus'}
                              </strong>
                            </div>
                          </div>

                          {/* Passenger & Seats */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">যাত্রীর নাম:</span>
                              <strong className="text-slate-900 font-bold text-[10px]">
                                {b.customerName}
                              </strong>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">মোবাইল নম্বর:</span>
                              <span className="font-mono font-bold text-slate-800">{b.customerPhone}</span>
                            </div>

                            <div className="flex justify-between items-center bg-emerald-100 p-1 rounded border border-emerald-300">
                              <span className="font-bold text-emerald-900 text-[9px]">বরাদ্দকৃত সিট:</span>
                              <strong className="text-emerald-950 font-black text-xs font-mono">
                                {b.selectedSeats.join(', ')}
                              </strong>
                            </div>

                            <div className="flex justify-between items-center bg-amber-50 p-1 rounded border border-amber-300 text-[8.5px]">
                              <span className="font-bold text-amber-900">🏨 হোটেল ও রুম:</span>
                              <strong className="text-amber-950 font-black truncate max-w-[90mm]">
                                {getBookingHotelSummary(b)}
                              </strong>
                            </div>
                          </div>

                          {/* Accounts Box */}
                          <div className="border-t border-gray-200 pt-1 text-[8px] space-y-0.5">
                            <div className="flex justify-between">
                              <span>মোট ভাড়া: {CalculationUtils.formatCurrency(b.payableAmount)}</span>
                              <span className="text-emerald-800 font-bold">
                                জমা: {CalculationUtils.formatCurrency(b.advanceAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between font-bold text-rose-700">
                              <span>বকেয়া: {CalculationUtils.formatCurrency(b.dueAmount)}</span>
                              <span className="text-teal-800">এজেন্ট: {b.agentName || b.bookerCode || 'Direct'}</span>
                            </div>
                          </div>

                          {/* Footer Terms */}
                          <div className="border-t border-dashed border-gray-300 pt-1 text-[7px] text-gray-500 flex justify-between">
                            <span>* ভ্রমণের সময় সাথে রাখুন</span>
                            <span>শুভ যাত্রা</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: A4 FOOD TOKEN PRINT CENTER (10 TOKENS PER PAGE: 2 COLS x 5 ROWS) */}
      {/* ==================================================================== */}
      {activeTab === 'tokens-a4' && (
        <div className="space-y-6">
          {/* Token Filters & Menu Configurator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 no-print shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-4 h-4" />
                <span>খাবার টোকেন ফিল্টার ও মেনু কাস্টমাইজার</span>
              </span>
              <span className="text-xs text-slate-400 font-bold">
                মোট জেনারেটেড সিট টোকেন: <strong className="text-amber-400 font-black text-sm">{seatTokens.length}</strong> টি | পেজ লাগবে: <strong className="text-white">{tokenPages.length}</strong> টি A4
              </span>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Meal Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1">
                  খাবারের মেল নির্বাচন করুন:
                </label>
                <select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 text-amber-400 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                >
                  {Object.keys(mealLabels).map((m) => (
                    <option key={m} value={m}>
                      {mealLabels[m]}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Bus Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  বাসের নাম/টাইপ (Bus Type):
                </label>
                <select
                  value={tokenBusFilter}
                  onChange={(e) => setTokenBusFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">সকল বাস (All Buses)</option>
                  {uniqueBusTypes.map((bus) => (
                    <option key={bus} value={bus}>
                      {bus} Bus
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Tour Package */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ট্যুর প্যাকেজ (Tour Name):
                </label>
                <select
                  value={tokenTourFilter}
                  onChange={(e) => setTokenTourFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">সকল ট্যুর (All Tours)</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Agent Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  এজেন্ট বুকিং (Agent / Booker):
                </label>
                <select
                  value={tokenAgentFilter}
                  onChange={(e) => setTokenAgentFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">সকল এজেন্ট (All Agents)</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.agencyName}>
                      {ag.agencyName}
                    </option>
                  ))}
                  <option value="HQ Direct">HQ Direct</option>
                </select>
              </div>
            </div>

            {/* Custom Editable Menu & Note Title Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-amber-400 font-bold mb-1">
                  প্যাকেজ খাবারের মেনু যুক্ত করুন ({mealLabels[selectedMealType]}):
                </label>
                <input
                  type="text"
                  value={mealMenus[selectedMealType] || ''}
                  onChange={(e) =>
                    setMealMenus({ ...mealMenus, [selectedMealType]: e.target.value })
                  }
                  placeholder="মেনু লিখুন (যেমন: পরোটা, ডিম ভাজি, ডাল, চা)"
                  className="w-full bg-slate-950 border border-amber-500/40 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-amber-400 font-bold mb-1">
                  অতিরিক্ত খাবার নোট বক্স শিরোনাম (Extra Note Box Heading):
                </label>
                <input
                  type="text"
                  value={extraNoteBoxTitle}
                  onChange={(e) => setExtraNoteBoxTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* PRINTABLE A4 FOOD TOKEN PAGES CONTAINER */}
          <div id="printable-area" className="space-y-8 flex flex-col items-center">
            {tokenPages.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 no-print">
                <Utensils className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                <p className="font-bold">কোনো খাবারের টোকেন পাওয়া যায়নি</p>
                <p className="text-xs mt-1">অনুগ্রহ করে ফিল্টার পরিবর্তন করুন</p>
              </div>
            ) : (
              tokenPages.map((pageTokens, pageIdx) => (
                <div key={`token-page-${pageIdx}`} className="a4-page-wrapper no-print-wrapper">
                  <div className="text-center text-xs font-bold text-slate-400 mb-2 no-print">
                    --- A4 পেজ নম্বর: {pageIdx + 1} / {tokenPages.length} (১০টি টোকেন) ---
                  </div>

                  {/* A4 Sheet Container: Exactly 2 Columns x 5 Rows */}
                  <div className="a4-page bg-white text-black font-sans border border-gray-300 shadow-2xl p-3 w-[210mm] min-h-[297mm] mx-auto grid grid-cols-2 grid-rows-5 gap-2.5 print:border-none print:shadow-none print:p-2 print:m-0">
                    {pageTokens.map((tk) => (
                      <div
                        key={tk.tokenId}
                        className="border-2 border-dashed border-gray-400 rounded-xl p-2.5 space-y-1 text-[9px] relative bg-white print:border-black"
                      >
                        {/* Token Header */}
                        <div className="flex items-center justify-between border-b border-gray-300 pb-1">
                          <div className="flex items-center gap-1">
                            <img src="/logo.svg" alt="Logo" className="h-4 w-auto" />
                            <span className="font-black text-[10px] uppercase text-slate-900">
                              {settings.businessName}
                            </span>
                          </div>
                          <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                            {mealLabels[selectedMealType] || selectedMealType}
                          </span>
                        </div>

                        {/* Passenger Name & Seat Number */}
                        <div className="flex items-center justify-between pt-0.5">
                          <div>
                            <span className="text-gray-500 text-[8px] block">যাত্রীর নাম:</span>
                            <strong className="text-slate-900 font-bold text-[10px] truncate block max-w-[110mm]">
                              {tk.passengerName}
                            </strong>
                          </div>

                          <div className="text-right">
                            <span className="text-gray-500 text-[8px] block">সিট নম্বর:</span>
                            <span className="bg-emerald-100 text-emerald-950 font-black text-sm px-2 py-0.5 rounded border border-emerald-400">
                              {tk.seatNumber}
                            </span>
                          </div>
                        </div>

                        {/* Tour & Bus Info */}
                        <div className="text-[8px] text-gray-600 flex justify-between border-t border-gray-100 pt-0.5">
                          <span>ট্যুর: <strong>{tk.tourName}</strong></span>
                          <span>বাস: <strong>{tk.busName}</strong></span>
                        </div>

                        {/* Hotel & Room Info */}
                        <div className="flex justify-between items-center bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[8.5px]">
                          <span className="text-amber-900 font-bold">🏨 হোটেল ও রুম:</span>
                          <strong className="text-amber-950 font-black truncate max-w-[90mm]">
                            {tk.hotelInfo}
                          </strong>
                        </div>

                        {/* Custom Menu Items Box */}
                        <div className="bg-amber-50 border border-amber-200 p-1 rounded text-[8px] text-amber-950 font-semibold">
                          <strong className="text-amber-900">মেনু:</strong> {mealMenus[selectedMealType]}
                        </div>

                        {/* Extra Note / Write Box for Outside Package Consumption */}
                        <div className="border border-dashed border-gray-400 rounded p-1 space-y-0.5 bg-gray-50">
                          <span className="text-[7px] font-bold text-gray-700 block">
                            {extraNoteBoxTitle}
                          </span>
                          <div className="border-b border-gray-300 h-2"></div>
                          <div className="border-b border-gray-300 h-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PRINT MEASUREMENT & SIZE SETTINGS */}
      {/* ==================================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {saveSuccess && (
            <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              প্রিন্টার প্রিসেট নির্বাচন করুন (Quick Paper Size Presets)
            </h3>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['Thermal 80mm', 'Thermal 58mm', 'A4 Standard', 'A5 Compact', 'Custom'] as const).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      let updated: Partial<PrintSettings> = { presetName: p };
                      if (p === 'Thermal 80mm') {
                        updated = { ...updated, ticketWidth: 80, ticketHeight: 180, ticketUnit: 'mm' };
                      } else if (p === 'Thermal 58mm') {
                        updated = { ...updated, ticketWidth: 58, ticketHeight: 150, ticketUnit: 'mm' };
                      } else if (p === 'A4 Standard') {
                        updated = { ...updated, ticketWidth: 210, ticketHeight: 297, ticketUnit: 'mm' };
                      }
                      setPs({ ...ps, ...updated });
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      ps.presetName === p
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>কাস্টম মেজারমেন্ট কন্ট্রোলস</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">প্রস্থ (Width)</label>
                    <input
                      type="number"
                      value={ps.ticketWidth}
                      onChange={(e) => setPs({ ...ps, ticketWidth: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">দৈর্ঘ্য (Height)</label>
                    <input
                      type="number"
                      value={ps.ticketHeight}
                      onChange={(e) => setPs({ ...ps, ticketHeight: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">ইউনিট (Unit)</label>
                    <select
                      value={ps.ticketUnit}
                      onChange={(e) => setPs({ ...ps, ticketUnit: e.target.value as TicketUnit })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="mm">mm</option>
                      <option value="px">px</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
