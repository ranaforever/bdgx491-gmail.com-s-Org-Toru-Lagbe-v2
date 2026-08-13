import React, { useState } from 'react';
import {
  Tour,
  Booking,
  Passenger,
  Gender,
  Religion,
  GroupType,
  PrintSettings,
  UserSession,
} from '../../types';
import { StorageService } from '../../services/storage';
import { CalculationUtils } from '../../utils/calculations';
import { SeatMap } from './SeatMap';
import {
  Bus,
  Calendar,
  CheckCircle2,
  CreditCard,
  Heart,
  MapPin,
  Printer,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
  Users,
} from 'lucide-react';

interface PublicBookingFlowProps {
  onBookingComplete?: (booking: Booking) => void;
  onViewTicket?: (booking: Booking) => void;
  session?: UserSession | null;
}

export const PublicBookingFlow: React.FC<PublicBookingFlowProps> = ({
  onBookingComplete,
  onViewTicket,
  session,
}) => {
  const tours = StorageService.getTours().filter((t) => t.status !== 'Cancelled');
  const templates = StorageService.getTemplates();
  const agents = StorageService.getAgents();
  const allBookings = StorageService.getBookings();

  const sessionAgent = agents.find(
    (a) => a.code.toUpperCase() === session?.agentCode?.toUpperCase()
  );

  const [selectedTourId, setSelectedTourId] = useState<string>(tours[0]?.id || '');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isSeatsConfirmed, setIsSeatsConfirmed] = useState<boolean>(false);
  const [groupType, setGroupType] = useState<GroupType>('Single');
  const [agentId, setAgentId] = useState<string>(sessionAgent?.id || agents[0]?.id || '');

  // Primary customer contact fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('+880 ');
  const [customerAltPhone, setCustomerAltPhone] = useState<string>('+880 ');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerGender, setCustomerGender] = useState<Gender>('Male');
  const [customerReligion, setCustomerReligion] = useState<Religion>('Islam');

  const [discountInput, setDiscountInput] = useState<number>(0);
  const [advanceInput, setAdvanceInput] = useState<number>(0);
  const [passengersData, setPassengersData] = useState<Record<string, Partial<Passenger>>>({});

  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentTour = tours.find((t) => t.id === selectedTourId) || tours[0];
  const currentTemplate = templates.find((t) => t.id === currentTour?.layoutTemplateId) || templates[0];
  const bookedSeats = currentTour
    ? CalculationUtils.getBookedSeatsForTour(currentTour.id, allBookings)
    : new Set<string>();
  const seatGenderMap = currentTour
    ? CalculationUtils.getSeatGenderMappingForTour(currentTour.id, allBookings)
    : {};

  // Toggle seat selection
  const handleToggleSeat = (seatLabel: string) => {
    if (selectedSeats.includes(seatLabel)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatLabel));
      const copy = { ...passengersData };
      delete copy[seatLabel];
      setPassengersData(copy);
    } else {
      const newSelected = [...selectedSeats, seatLabel];
      setSelectedSeats(newSelected);
      setPassengersData((prev) => ({
        ...prev,
        [seatLabel]: {
          name: prev[seatLabel]?.name || '',
          phone: prev[seatLabel]?.phone || '',
          gender: prev[seatLabel]?.gender || customerGender || 'Male',
          religion: prev[seatLabel]?.religion || customerReligion || 'Islam',
          seatNumber: seatLabel,
        },
      }));
    }
  };

  // Calculations
  const seatPrice = currentTour?.fee || 0;
  const totalFee = selectedSeats.length * seatPrice;
  const discount = Math.min(discountInput, totalFee);
  const payableAmount = Math.max(0, totalFee - discount);
  const advanceAmount = Math.min(advanceInput, payableAmount);
  const dueAmount = payableAmount - advanceAmount;

  // Update passenger field
  const handlePassengerChange = (seat: string, field: keyof Passenger, value: any) => {
    setPassengersData((prev) => ({
      ...prev,
      [seat]: {
        ...prev[seat],
        [field]: value,
      },
    }));
  };

  // Submit Booking
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedSeats.length === 0) {
      setErrorMessage('অনুগ্রহ করে অন্তত একটি সিট সিলেক্ট করুন (Select at least 1 seat)');
      return;
    }

    if (!customerName || customerName.trim() === '') {
      setErrorMessage('অনুগ্রহ করে প্রধান বুকিংকারীর নাম লিখুন');
      return;
    }

    if (!customerPhone || customerPhone.trim() === '' || customerPhone === '+880 ') {
      setErrorMessage('অনুগ্রহ করে প্রধান বুকিংকারীর মোবাইল নম্বর লিখুন (+880...)');
      return;
    }

    // Generate Passenger objects - fill missing names with customerName
    const finalPassengers: Passenger[] = selectedSeats.map((seat, index) => {
      const seatPsg = passengersData[seat];
      const name = seatPsg?.name && seatPsg.name.trim() !== '' 
        ? seatPsg.name 
        : index === 0 
          ? customerName 
          : `${customerName} (${seat})`;
      
      const phone = seatPsg?.phone && seatPsg.phone.trim() !== ''
        ? seatPsg.phone
        : customerPhone;

      return {
        id: `psg-${Date.now()}-${index}`,
        bookingId: '',
        name,
        phone,
        gender: (seatPsg?.gender as Gender) || customerGender || 'Male',
        religion: (seatPsg?.religion as Religion) || customerReligion || 'Islam',
        seatNumber: seat,
      };
    });

    const activeAgentObj = session?.role === 'agent' 
      ? sessionAgent 
      : agents.find((a) => a.id === agentId);

    const bookingId = CalculationUtils.generateBookingId();
    const groupId =
      groupType !== 'Single' ? CalculationUtils.generateGroupId(groupType as any) : undefined;

    const agentDisplayName = activeAgentObj 
      ? `${activeAgentObj.name} (${activeAgentObj.agencyName})`
      : session?.agentName || 'Master Admin';

    const newBooking: Booking = {
      id: bookingId,
      tourId: currentTour.id,
      agentId: activeAgentObj?.id || 'direct',
      bookerCode: activeAgentObj?.code || session?.agentCode || 'DIRECT',
      agentName: agentDisplayName,
      customerName,
      customerPhone,
      customerAltPhone: customerAltPhone !== '+880 ' ? customerAltPhone : undefined,
      customerAddress: customerAddress.trim() || undefined,
      customerGender,
      customerReligion,
      selectedSeats,
      groupType,
      groupId,
      passengerCount: selectedSeats.length,
      passengers: finalPassengers.map((p) => ({ ...p, bookingId })),
      totalFee,
      discount,
      payableAmount,
      advanceAmount,
      dueAmount,
      paymentStatus: dueAmount === 0 ? 'Paid' : advanceAmount > 0 ? 'Partial' : 'Unpaid',
      bookingStatus: 'Confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save
    const existing = StorageService.getBookings();
    StorageService.saveBookings([newBooking, ...existing]);

    setConfirmedBooking(newBooking);
    if (onBookingComplete) onBookingComplete(newBooking);
  };

  if (confirmedBooking) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">বুকিং সফল হয়েছে! 🎉</h2>
          <p className="text-xs text-slate-400 mt-1">
            বুকিং আইডি: <span className="text-emerald-400 font-bold">{confirmedBooking.id}</span>
          </p>
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 text-left space-y-2 text-xs text-slate-300">
          <div className="flex justify-between border-b border-slate-700 pb-2">
            <span className="text-slate-400">ট্যুরের নাম:</span>
            <span className="font-bold text-white">{currentTour.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-700 pb-2">
            <span className="text-slate-400">সিট নম্বর:</span>
            <span className="font-bold text-emerald-400">{confirmedBooking.selectedSeats.join(', ')}</span>
          </div>
          <div className="flex justify-between border-b border-slate-700 pb-2">
            <span className="text-slate-400">যাত্রীর সংখ্যা:</span>
            <span className="font-bold text-white">{confirmedBooking.passengerCount} জন</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">মোট পেয়েবল:</span>
            <span className="font-black text-emerald-400">
              {CalculationUtils.formatCurrency(confirmedBooking.payableAmount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onViewTicket && onViewTicket(confirmedBooking)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>টিকিট এবং টোকেন প্রিন্ট করুন</span>
          </button>
          <button
            onClick={() => {
              setConfirmedBooking(null);
              setSelectedSeats([]);
              setIsSeatsConfirmed(false);
              setPassengersData({});
            }}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl text-xs transition-colors"
          >
            নতুন বুকিং করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tour Selection Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              অনলাইন টিকিট বুকিং পোর্টাল
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-2">
              আপনার পছন্দের ট্যুর সিলেক্ট করুন
            </h1>
          </div>

          <div className="w-full md:w-72">
            <select
              value={selectedTourId}
              onChange={(e) => {
                setSelectedTourId(e.target.value);
                setSelectedSeats([]);
                setIsSeatsConfirmed(false);
                setPassengersData({});
              }}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.tourCategory === 'Day Long' ? '☀️ Day Long' : '🌴 Relax'}] {t.name} ({t.startDate})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Tour Summary Details */}
        {currentTour && (
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>ট্যুর টাইপ</span>
              </div>
              <span
                className={`font-bold text-[11px] px-2 py-0.5 rounded inline-block ${
                  currentTour.tourCategory === 'Day Long'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {currentTour.tourCategory === 'Day Long' ? '☀️ Day Long' : '🌴 Relax Tour'}
              </span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>যাত্রার তারিখ</span>
              </div>
              <span className="font-bold text-white text-sm">{currentTour.startDate}</span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Bus className="w-3.5 h-3.5 text-teal-400" />
                <span>বাসের ধরন</span>
              </div>
              <span className="font-bold text-white text-sm">{currentTour.busType} Bus</span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Ticket className="w-3.5 h-3.5 text-amber-400" />
                <span>প্রতি সিট ফি</span>
              </div>
              <span className="font-black text-emerald-400 text-sm">
                {CalculationUtils.formatCurrency(currentTour.fee)}
              </span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>ফ্রি সিট</span>
              </div>
              <span className="font-bold text-white text-sm">
                {currentTour.totalSeats - bookedSeats.size} / {currentTour.totalSeats}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Step 1 (Seat Alignment Selection) vs Step 2 (Passenger Booking Form) */}
      {!isSeatsConfirmed ? (
        /* STEP 1: BUS SEAT LAYOUT & ALIGNMENT */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                ধাপ ১: সিট নির্বাচন (Step 1: Seat Alignment)
              </span>
              <h2 className="text-lg font-black text-white mt-1">
                🚌 বাসের সিট লেআউট ও এলাইনমেন্ট নির্বাচন করুন
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              সিলেক্টেড সিট: <strong className="text-emerald-400 text-sm">{selectedSeats.length}</strong> টি
            </div>
          </div>

          {errorMessage && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl font-semibold text-center">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Seat Map */}
          <div className="flex justify-center">
            {currentTemplate ? (
              <div className="w-full max-w-md">
                <SeatMap
                  layout={currentTemplate}
                  bookedSeats={bookedSeats}
                  seatGenderMap={seatGenderMap}
                  selectedSeats={selectedSeats}
                  onToggleSeat={handleToggleSeat}
                />
              </div>
            ) : (
              <p className="text-xs text-rose-400 text-center p-4">সিট লেআউট পাওয়া যায়নি</p>
            )}
          </div>

          {/* Selected Seat Footer Action Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-slate-400 text-xs block">সিলেক্টকৃত সিটসমূহ:</span>
              <div className="flex items-center gap-2 mt-1">
                {selectedSeats.length > 0 ? (
                  <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                    {selectedSeats.join(', ')}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 italic">এখনো কোনো সিট সিলেক্ট করা হয়নি</span>
                )}
                <span className="text-xs font-bold text-slate-300 ml-2">
                  | মোট ফি: <strong className="text-emerald-400">{CalculationUtils.formatCurrency(totalFee)}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (selectedSeats.length === 0) {
                  setErrorMessage('অনুগ্রহ করে অন্তত ১টি সিট সিলেক্ট করুন (Please select at least 1 seat)');
                  return;
                }
                setErrorMessage('');
                setIsSeatsConfirmed(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>সিট কনফার্ম করুন ও তথ্য দিন (Proceed to Booking Form)</span>
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: BOOKING DETAILS FORM */
        <div className="space-y-6">
          {/* Top Return Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1 rounded-xl">
                ধাপ ২: বুকিং ফর্ম
              </span>
              <span className="text-xs font-bold text-white">
                সিলেক্টেড সিট: <strong className="text-emerald-400 font-mono text-sm">{selectedSeats.join(', ')}</strong> ({selectedSeats.length} টি)
              </span>
            </div>

            <button
              onClick={() => setIsSeatsConfirmed(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              ← সিট ও লেআউট পরিবর্তন করুন
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Seat Map Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4">
                <h3 className="text-xs font-bold text-slate-400 mb-3 text-center">
                  🚌 নির্বাচিত সিট লেআউট প্রিয়ভিউ ({selectedSeats.length} টি সিলেক্টেড)
                </h3>
                {currentTemplate && (
                  <SeatMap
                    layout={currentTemplate}
                    bookedSeats={bookedSeats}
                    seatGenderMap={seatGenderMap}
                    selectedSeats={selectedSeats}
                    onToggleSeat={handleToggleSeat}
                  />
                )}
              </div>
            </div>

            {/* Right Col: Booking Form */}
            <div className="lg:col-span-7 space-y-6">
              <form onSubmit={handleConfirmBooking} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-400" />
                    <span>যাত্রী তথ্য ও পেমেন্ট বিবরণ</span>
                  </h2>

                  {/* Group Type Selector */}
                  <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
                    {(['Single', 'Couple', 'Family', 'Group'] as GroupType[]).map((gt) => (
                      <button
                        key={gt}
                        type="button"
                        onClick={() => setGroupType(gt)}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          groupType === gt
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {gt === 'Couple' ? '👫 কাপল' : gt === 'Family' ? '👨‍👩‍👧 ফ্যামিলি' : gt === 'Group' ? '👥 গ্রুপ' : '👤 সিঙ্গেল'}
                      </button>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl font-semibold">
                    ⚠️ {errorMessage}
                  </div>
                )}

            {/* Primary Customer Details Section */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-700/80 pb-2 flex items-center justify-between">
                <span>১. প্রধান বুকিংকারীর তথ্য (Main Customer Contact)</span>
                <span className="text-[10px] text-slate-400 font-normal">* চিহ্নিত ঘরগুলো আবশ্যক</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    প্রধান বুকিংকারীর নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. আবদুর রহিম"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    প্রধান মোবাইল নম্বর (+880...) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+880 1711000000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    বিকল্প মোবাইল নম্বর (Alternative Mobile)
                  </label>
                  <input
                    type="text"
                    value={customerAltPhone}
                    onChange={(e) => setCustomerAltPhone(e.target.value)}
                    placeholder="+880 1811000000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    যাত্রীর বাসাবাড়ির ঠিকানা (Passenger Address)
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g. বাসা ২০, রোড ৫, মিরপুর-১০, ঢাকা"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      লিঙ্গ (Gender)
                    </label>
                    <select
                      value={customerGender}
                      onChange={(e) => setCustomerGender(e.target.value as Gender)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Male">পুরুষ (Male)</option>
                      <option value="Female">নারী (Female)</option>
                      <option value="Other">অন্যান্য</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      ধর্ম (Religion)
                    </label>
                    <select
                      value={customerReligion}
                      onChange={(e) => setCustomerReligion(e.target.value as Religion)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Islam">ইসলাম</option>
                      <option value="Hindu">হিন্দু</option>
                      <option value="Christian">খ্রিস্টান</option>
                      <option value="Buddhist">বৌদ্ধ</option>
                      <option value="Other">অন্যান্য</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Seats Passengers Form */}
            {selectedSeats.length === 0 ? (
              <div className="text-center py-10 bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-6">
                <Ticket className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-300 font-semibold">
                  বামপাশের বাসের সিট লেআউট থেকে আপনার পছন্দের সিট সিলেক্ট করুন
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase">
                    ২. সিট অনুযায়ী যাত্রীদের বিস্তারিত (ঐচ্ছিক)
                  </span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    খালি রাখলে প্রধান ব্যক্তির নাম ব্যবহৃত হবে
                  </span>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {selectedSeats.map((seat, idx) => (
                    <div
                      key={seat}
                      className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-lg">
                          সিট: {seat} {idx === 0 ? '(প্রধান যাত্রীর সিট)' : ''}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ফি: {CalculationUtils.formatCurrency(seatPrice)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                            যাত্রীর নাম (খালি রাখলে প্রধান নাম বসবে)
                          </label>
                          <input
                            type="text"
                            value={passengersData[seat]?.name || ''}
                            onChange={(e) => handlePassengerChange(seat, 'name', e.target.value)}
                            placeholder={customerName ? customerName : `যাত্রী ${seat}`}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                            মোবাইল (ঐচ্ছিক)
                          </label>
                          <input
                            type="text"
                            value={passengersData[seat]?.phone || ''}
                            onChange={(e) => handlePassengerChange(seat, 'phone', e.target.value)}
                            placeholder={customerPhone || "+880..."}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent / Booker Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  বুকিং এজেন্ট (Booker)
                </label>
                {session?.role === 'agent' ? (
                  <div className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold flex items-center justify-between">
                    <span>{sessionAgent?.name || session?.agentName} ({sessionAgent?.agencyName || session?.agencyName})</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">লগইনকৃত এজেন্ট</span>
                  </div>
                ) : (
                  <select
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="direct">Direct HQ Booking (No Agent)</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.agencyName})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ডিসকাউন্ট (Discount Amount)
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalFee}
                  value={discountInput}
                  onChange={(e) => setDiscountInput(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>
            </div>

            {/* Financial Summary & Payment */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>মোট সিট ফি ({selectedSeats.length} টি):</span>
                <span className="font-bold text-white">{CalculationUtils.formatCurrency(totalFee)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>ছাড় / ডিসকাউন্ট:</span>
                <span className="font-bold text-rose-400">
                  - {CalculationUtils.formatCurrency(discount)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white border-t border-slate-800 pt-2">
                <span>মোট প্রদানযোগ্য (Payable):</span>
                <span className="text-emerald-400">{CalculationUtils.formatCurrency(payableAmount)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    অগ্রিম প্রদান (Advance)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={payableAmount}
                    value={advanceInput}
                    onChange={(e) => setAdvanceInput(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    বকেয়া (Due Amount)
                  </label>
                  <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-rose-400 font-black">
                    {CalculationUtils.formatCurrency(dueAmount)}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={selectedSeats.length === 0}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>বুকিং কনফার্ম করুন ({CalculationUtils.formatCurrency(payableAmount)})</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )}
</div>
);
};
