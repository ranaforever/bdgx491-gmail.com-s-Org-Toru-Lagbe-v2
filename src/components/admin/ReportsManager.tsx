import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { CalculationUtils } from '../../utils/calculations';
import { ExportUtils } from '../../utils/pdfExport';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Users,
  Building2,
  Calendar,
  Bus,
} from 'lucide-react';

export const ReportsManager: React.FC = () => {
  const tours = StorageService.getTours();
  const agents = StorageService.getAgents();
  const hotels = StorageService.getHotels();
  const bookings = StorageService.getBookings();

  const [selectedTourId, setSelectedTourId] = useState<string>(tours[0]?.id || '');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [activeReportTab, setActiveReportTab] = useState<'hotel' | 'passenger' | 'payment'>('hotel');

  const currentTour = tours.find((t) => t.id === selectedTourId) || tours[0];

  // Filtered bookings
  const tourBookings = bookings.filter(
    (b) => b.tourId === selectedTourId && b.bookingStatus !== 'Cancelled'
  );

  const filteredBookings = tourBookings.filter(
    (b) => selectedAgentId === 'all' || b.agentId === selectedAgentId
  );

  // Export CSV Handler
  const handleExportCSV = () => {
    if (activeReportTab === 'passenger') {
      const headers = ['Booking ID', 'Passenger Name', 'Phone', 'Gender', 'Religion', 'Seat', 'Agent Code', 'Group Type'];
      const rows = filteredBookings.flatMap((b) =>
        b.passengers.map((p) => [
          b.id,
          p.name,
          p.phone,
          p.gender,
          p.religion,
          p.seatNumber,
          b.bookerCode,
          b.groupType,
        ])
      );
      ExportUtils.exportToCSV(`passenger_manifest_${selectedTourId}`, headers, rows);
    } else if (activeReportTab === 'payment') {
      const headers = ['Booking ID', 'Customer Name', 'Seats', 'Total Fee', 'Discount', 'Payable', 'Advance', 'Due', 'Payment Status'];
      const rows = filteredBookings.map((b) => [
        b.id,
        b.customerName,
        b.selectedSeats.join('; '),
        b.totalFee,
        b.discount,
        b.payableAmount,
        b.advanceAmount,
        b.dueAmount,
        b.paymentStatus,
      ]);
      ExportUtils.exportToCSV(`payment_report_${selectedTourId}`, headers, rows);
    } else {
      // Hotel Report CSV
      const headers = ['Agent Code', 'Passenger Name', 'Seat', 'Room Type', 'Room Number', 'Hotel Name'];
      const rows: (string | number)[][] = [];

      hotels.forEach((h) => {
        h.rooms.forEach((r) => {
          r.assignedPassengerIds.forEach((pId) => {
            const allPassengers = StorageService.getAllPassengers();
            const psg = allPassengers.find((p) => p.id === pId);
            const bk = bookings.find((b) => b.id === psg?.bookingId);
            if (psg && bk) {
              rows.push([bk.bookerCode, psg.name, psg.seatNumber, r.roomType, r.roomNumber, h.name]);
            }
          });
        });
      });

      ExportUtils.exportToCSV(`hotel_room_report_${selectedTourId}`, headers, rows);
    }
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Controls Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            অপারেশনাল ও হোটেল রিপোর্ট
          </span>
          <h1 className="text-xl font-black text-white mt-1">
            এজেন্টওয়াইজ হোটেল রুম ও প্যাসেঞ্জার ম্যানিফেস্ট
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          <button
            onClick={() => ExportUtils.triggerPrint()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>রিপোর্ট প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          {(['hotel', 'passenger', 'payment'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveReportTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeReportTab === tab
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {tab === 'hotel' ? '🏨 এজেন্টওয়াইজ হোটেল রিপোর্ট' : tab === 'passenger' ? '🚌 প্যাসেঞ্জার ম্যানিফেস্ট' : '💰 পেমেন্ট সামারি'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedTourId}
            onChange={(e) => setSelectedTourId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5"
          >
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5"
          >
            <option value="all">সকল এজেন্ট (All Agents)</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.agencyName} ({a.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Printable Report Output Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 print:bg-white print:text-black print:border-none print:p-0">
        {/* Printable Header Title */}
        <div className="border-b border-slate-800 print:border-black pb-4 text-center">
          <h2 className="text-xl font-black text-white print:text-black uppercase">
            Tour লাগবে - {activeReportTab === 'hotel' ? 'AGENTS HOTEL ROOM ASSIGNMENT REPORT' : 'PASSENGER MANIFEST & PAYMENT REPORT'}
          </h2>
          <p className="text-xs text-slate-400 print:text-gray-700 mt-1 font-bold">
            ট্যুর: {currentTour?.name} ({currentTour?.startDate}) | বাসের ধরন: {currentTour?.busType}
          </p>
        </div>

        {/* Report Tab 1: Agent-Wise Hotel Report */}
        {activeReportTab === 'hotel' && (
          <div className="space-y-6">
            {agents
              .filter((a) => selectedAgentId === 'all' || a.id === selectedAgentId)
              .map((agent) => {
                const agentBk = tourBookings.filter(
                  (b) => b.agentId === agent.id || b.bookerCode === agent.code
                );
                const agentPassengers = agentBk.flatMap((b) => b.passengers);

                if (agentPassengers.length === 0) return null;

                return (
                  <div
                    key={agent.id}
                    className="bg-slate-950/60 border border-slate-800 print:border-gray-300 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 print:border-gray-300 pb-2">
                      <span className="font-black text-emerald-400 print:text-black text-sm">
                        এজেন্ট: {agent.agencyName} ({agent.code})
                      </span>
                      <span className="text-xs font-bold text-slate-300 print:text-gray-800">
                        মোট যাত্রী: {agentPassengers.length} জন
                      </span>
                    </div>

                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-800 print:bg-gray-200 text-slate-300 print:text-black font-bold">
                          <th className="p-2">যাত্রীর নাম</th>
                          <th className="p-2">সিট</th>
                          <th className="p-2">গ্রুপ টাইপ</th>
                          <th className="p-2">হোটেলের নাম</th>
                          <th className="p-2">রুম নম্বর</th>
                          <th className="p-2">রুম টাইপ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                        {agentPassengers.map((psg) => {
                          const bk = agentBk.find((b) => b.id === psg.bookingId);
                          // Find room assigned to psg
                          let assignedHotelName = 'Unassigned';
                          let assignedRoomNum = 'N/A';
                          let assignedRoomType = 'N/A';

                          hotels.forEach((h) => {
                            h.rooms.forEach((r) => {
                              if (r.assignedPassengerIds.includes(psg.id)) {
                                assignedHotelName = h.name;
                                assignedRoomNum = r.roomNumber;
                                assignedRoomType = r.roomType;
                              }
                            });
                          });

                          return (
                            <tr key={psg.id}>
                              <td className="p-2 font-bold text-white print:text-black">{psg.name}</td>
                              <td className="p-2 text-emerald-400 print:text-black font-bold">{psg.seatNumber}</td>
                              <td className="p-2">{bk?.groupType}</td>
                              <td className="p-2">{assignedHotelName}</td>
                              <td className="p-2 font-bold">{assignedRoomNum}</td>
                              <td className="p-2">{assignedRoomType}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
          </div>
        )}

        {/* Report Tab 2: Passenger Manifest */}
        {activeReportTab === 'passenger' && (
          <table className="w-full text-left text-xs text-slate-300 print:text-black border-collapse">
            <thead>
              <tr className="bg-slate-800 print:bg-gray-200 font-bold uppercase text-[10px]">
                <th className="p-2.5">সিট</th>
                <th className="p-2.5">যাত্রীর নাম</th>
                <th className="p-2.5">মোবাইল</th>
                <th className="p-2.5">লিঙ্গ</th>
                <th className="p-2.5">ধর্ম</th>
                <th className="p-2.5">বুকিং ID</th>
                <th className="p-2.5">বুকার কোড</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-gray-300">
              {filteredBookings
                .flatMap((b) => b.passengers.map((p) => ({ ...p, bookerCode: b.bookerCode, bId: b.id })))
                .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber))
                .map((p) => (
                  <tr key={p.id}>
                    <td className="p-2.5 font-black text-emerald-400 print:text-black">{p.seatNumber}</td>
                    <td className="p-2.5 font-bold text-white print:text-black">{p.name}</td>
                    <td className="p-2.5">{p.phone}</td>
                    <td className="p-2.5">{p.gender}</td>
                    <td className="p-2.5">{p.religion}</td>
                    <td className="p-2.5">{p.bId}</td>
                    <td className="p-2.5 font-bold text-teal-400 print:text-black">{p.bookerCode}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {/* Report Tab 3: Payment Summary */}
        {activeReportTab === 'payment' && (
          <table className="w-full text-left text-xs text-slate-300 print:text-black border-collapse">
            <thead>
              <tr className="bg-slate-800 print:bg-gray-200 font-bold uppercase text-[10px]">
                <th className="p-2.5">বুকিং ID</th>
                <th className="p-2.5">গ্রাহক</th>
                <th className="p-2.5">সিটসমূহ</th>
                <th className="p-2.5">মোট ফি</th>
                <th className="p-2.5">অ্যাডভান্স জমা</th>
                <th className="p-2.5">বকেয়া (Due)</th>
                <th className="p-2.5">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-gray-300">
              {filteredBookings.map((b) => (
                <tr key={b.id}>
                  <td className="p-2.5 font-bold text-white print:text-black">{b.id}</td>
                  <td className="p-2.5 font-semibold">{b.customerName}</td>
                  <td className="p-2.5 text-emerald-400 print:text-black font-bold">
                    {b.selectedSeats.join(', ')}
                  </td>
                  <td className="p-2.5 font-bold">{CalculationUtils.formatCurrency(b.payableAmount)}</td>
                  <td className="p-2.5 text-emerald-400 font-bold">
                    {CalculationUtils.formatCurrency(b.advanceAmount)}
                  </td>
                  <td className="p-2.5 text-rose-400 font-bold">
                    {CalculationUtils.formatCurrency(b.dueAmount)}
                  </td>
                  <td className="p-2.5 font-bold">{b.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
