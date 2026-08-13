import React from 'react';
import { StorageService } from '../../services/storage';
import { CalculationUtils } from '../../utils/calculations';
import {
  Compass,
  Bus,
  CreditCard,
  Building2,
  Users,
  AlertCircle,
  TrendingUp,
  Award,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const tours = StorageService.getTours();
  const bookings = StorageService.getBookings();
  const hotels = StorageService.getHotels();
  const agents = StorageService.getAgents();

  const financial = CalculationUtils.getFinancialSummary(bookings);
  const hotelStats = CalculationUtils.getHotelSummaryStats(hotels, bookings);

  // Seat stats calculation across upcoming tours
  const upcomingTours = tours.filter((t) => t.status === 'Upcoming');
  let totalBusSeats = 0;
  let totalBookedSeats = 0;

  upcomingTours.forEach((t) => {
    totalBusSeats += t.totalSeats;
    const booked = CalculationUtils.getBookedSeatsForTour(t.id, bookings);
    totalBookedSeats += booked.size;
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            এডমিন কন্ট্রোল সেন্টার Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Tour লাগবে সিস্টেম সামারি ওভারভিউ
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            ট্যুর বুকিং, বাসের সিট বরাদ্দ, এজেন্ট পারফরম্যান্স ও হোটেল রুম অ্যাসাইনমেন্টের রিয়েল-টাইম রিপোর্ট
          </p>
        </div>
      </div>

      {/* Unassigned Passenger Alert Banner */}
      {hotelStats.unassignedCount > 0 && (
        <div
          onClick={() => setActiveTab('room-assignments')}
          className="bg-amber-950/60 border border-amber-500/50 hover:bg-amber-950/80 rounded-3xl p-5 shadow-xl cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-300">
                জরুরি নোটিফিকেশন: {hotelStats.unassignedCount} জন যাত্রীর হোটেল রুম বরাদ্দ বাকি!
              </h3>
              <p className="text-xs text-amber-200/80">
                এখনই ক্লিক করে আনঅ্যাসাইনড যাত্রীদের সরাসরি হোটেল রুমে বরাদ্দ দিন
              </p>
            </div>
          </div>

          <button className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shrink-0">
            <span>রুম অ্যাসাইন করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">মোট কালেকশন (Total Revenue)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {CalculationUtils.formatCurrency(financial.totalRevenue)}
          </div>
          <div className="flex justify-between text-[11px] border-t border-slate-800 pt-2 text-slate-400">
            <span>জমা: <strong className="text-emerald-400">{CalculationUtils.formatCurrency(financial.totalAdvance)}</strong></span>
            <span>বকেয়া: <strong className="text-rose-400">{CalculationUtils.formatCurrency(financial.totalDue)}</strong></span>
          </div>
        </div>

        {/* Total Booked Seats */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">বাস সিট বুকিং</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {totalBookedSeats} / {totalBusSeats} <span className="text-xs font-normal text-slate-400">সিট</span>
          </div>
          <div className="text-[11px] text-teal-400 border-t border-slate-800 pt-2 font-semibold">
            ফাঁকা সিট: {totalBusSeats - totalBookedSeats} টি
          </div>
        </div>

        {/* Total Passengers */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">মোট যাত্রী ও বুকিং</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {financial.totalPassengers} <span className="text-xs font-normal text-slate-400">জন</span>
          </div>
          <div className="text-[11px] text-sky-400 border-t border-slate-800 pt-2 font-semibold">
            মোট বুকিং সংখ্যা: {financial.totalBookings} টি
          </div>
        </div>

        {/* Hotel Rooms */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">হোটেল রুম সামারি</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {hotelStats.occupiedRooms} / {hotelStats.totalRooms} <span className="text-xs font-normal text-slate-400">রুম ফুল</span>
          </div>
          <div className="text-[11px] text-amber-400 border-t border-slate-800 pt-2 font-semibold">
            ফাঁকা রুম: {hotelStats.availableRooms} টি
          </div>
        </div>
      </div>

      {/* Agent Performance Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Award className="w-5 h-5 text-amber-400" />
          <span>এজেন্ট ও বুকার পারফরম্যান্স লিডারবোর্ড</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const agentBookings = bookings.filter(
              (b) => (b.agentId === agent.id || b.bookerCode === agent.code) && b.bookingStatus !== 'Cancelled'
            );
            const passengersCount = agentBookings.reduce((acc, b) => acc + b.passengerCount, 0);
            const totalColl = agentBookings.reduce((acc, b) => acc + b.payableAmount, 0);

            return (
              <div key={agent.id} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{agent.agencyName}</span>
                  <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded">
                    {agent.code}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>বুকিং সংখ্যা: {agentBookings.length} টি</span>
                  <span className="font-bold text-emerald-400">{passengersCount} জন যাত্রী</span>
                </div>
                <div className="text-xs font-black text-white pt-1 border-t border-slate-700/60">
                  মোট সেলস: {CalculationUtils.formatCurrency(totalColl)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
