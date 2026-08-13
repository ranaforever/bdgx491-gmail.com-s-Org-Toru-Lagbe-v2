import React, { useState } from 'react';
import { Booking, BookingStatus, PaymentStatus, UserSession } from '../../types';
import { StorageService } from '../../services/storage';
import { CalculationUtils } from '../../utils/calculations';
import { CSVExportService } from '../../utils/csvExport';
import {
  BookmarkCheck,
  Search,
  Filter,
  Printer,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Eye,
  User,
  Phone,
  Download,
  CreditCard,
  DollarSign,
} from 'lucide-react';

interface BookingManagerProps {
  onViewTicket: (booking: Booking) => void;
  session?: UserSession | null;
}

export const BookingManager: React.FC<BookingManagerProps> = ({ onViewTicket, session }) => {
  const [bookings, setBookings] = useState<Booking[]>(StorageService.getBookings());
  const tours = StorageService.getTours();
  const agents = StorageService.getAgents();

  const isAdmin = session?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTourId, setFilterTourId] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [payingDueBooking, setPayingDueBooking] = useState<Booking | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);

  const handleOpenPayDue = (booking: Booking) => {
    setPayingDueBooking(booking);
    setPayAmountInput(booking.dueAmount);
  };

  const handleConfirmDuePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDueBooking || payAmountInput <= 0) return;

    const newAdvance = payingDueBooking.advanceAmount + payAmountInput;
    const newDue = Math.max(0, payingDueBooking.payableAmount - newAdvance);
    const newStatus: PaymentStatus = newDue === 0 ? 'Paid' : 'Partial';

    const updatedBooking: Booking = {
      ...payingDueBooking,
      advanceAmount: newAdvance,
      dueAmount: newDue,
      paymentStatus: newStatus,
    };

    const updated = bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
    setBookings(updated);
    StorageService.saveBookings(updated);
    setPayingDueBooking(null);
  };

  // Complete delete booking
  const handleDeleteBooking = (id: string, customerName: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${customerName}" এর বুকিংটি স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      const updated = bookings.filter((b) => b.id !== id);
      setBookings(updated);
      StorageService.saveBookings(updated);
    }
  };

  // Save complete booking edit
  const handleSaveBookingEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const updated = bookings.map((b) => (b.id === editingBooking.id ? editingBooking : b));
    setBookings(updated);
    StorageService.saveBookings(updated);
    setEditingBooking(null);
  };

  const sessionAgent = agents.find(
    (a) => a.code.toUpperCase() === session?.agentCode?.toUpperCase()
  );

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    // If agent role, only show own bookings
    if (session?.role === 'agent') {
      const isMine =
        b.agentId === sessionAgent?.id ||
        b.bookerCode?.toUpperCase() === session?.agentCode?.toUpperCase();
      if (!isMine) return false;
    }

    const matchesTour = filterTourId === 'all' || b.tourId === filterTourId;
    const matchesPayment = filterPayment === 'all' || b.paymentStatus === filterPayment;
    const matchesAgent = filterAgent === 'all' || b.agentId === filterAgent;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      b.id.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.includes(q) ||
      (b.agentName && b.agentName.toLowerCase().includes(q)) ||
      b.selectedSeats.some((s) => s.toLowerCase().includes(q));

    return matchesTour && matchesPayment && matchesAgent && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            বুকিং ও পেমেন্ট হিস্ট্রি
          </span>
          <h1 className="text-xl font-black text-white mt-1">
            বুকিং ম্যানেজমেন্ট ও অ্যাডভান্স কলেকশন
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">
            মোট রেকর্ডস: <strong className="text-emerald-400 text-sm">{filteredBookings.length}</strong> টি
          </div>
          <button
            onClick={() => CSVExportService.exportBookings(filteredBookings, tours)}
            className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            title="CSV এক্সপোর্ট করুন"
          >
            <Download className="w-4 h-4" />
            <span>CSV এক্সপোর্ট</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, ফোন, বুকিং ID, সিট দিয়ে খুঁজুন..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={filterTourId}
          onChange={(e) => setFilterTourId(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">সকল ট্যুর (All Tours)</option>
          {tours.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">সকল পেমেন্ট স্ট্যাটাস</option>
          <option value="Paid">Paid (পরিশোধিত)</option>
          <option value="Partial">Partial (আংশিক পরিশোধিত)</option>
          <option value="Unpaid">Unpaid (অপরিশোধিত)</option>
        </select>

        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">সকল এজেন্ট / বুকার</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.agencyName} ({a.code})
            </option>
          ))}
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">বুকিং ID / কোড</th>
              <th className="p-3.5">গ্রাহক ও মোবাইল</th>
              <th className="p-3.5">ট্যুর ও সিট</th>
              <th className="p-3.5">গ্রুপ টাইপ</th>
              <th className="p-3.5">মোট ফি</th>
              <th className="p-3.5">অ্যাডভান্স & ডিউ</th>
              <th className="p-3.5">পেমেন্ট স্ট্যাটাস</th>
              <th className="p-3.5 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredBookings.map((b) => {
              const tour = tours.find((t) => t.id === b.tourId);
              return (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5">
                    <span className="font-bold text-white block">{b.id}</span>
                    <span className="text-[10px] text-teal-400 font-semibold block truncate max-w-[150px]" title={b.agentName || b.bookerCode}>
                      এজেন্ট: {b.agentName || b.bookerCode}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className="font-bold text-slate-200 block">{b.customerName}</span>
                    <span className="text-[11px] text-slate-400 font-mono block">{b.customerPhone}</span>
                    {b.customerAltPhone && (
                      <span className="text-[10px] text-slate-500 font-mono block">Alt: {b.customerAltPhone}</span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <span className="font-semibold text-white block truncate max-w-[160px]">
                      {tour?.name || 'Tour'}
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px]">
                      সিট: {b.selectedSeats.join(', ')}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300">
                      {b.groupType}
                    </span>
                  </td>

                  <td className="p-3.5 font-bold text-white">
                    {CalculationUtils.formatCurrency(b.payableAmount)}
                  </td>

                  <td className="p-3.5 text-[11px]">
                    <div className="text-emerald-400 font-semibold">
                      জমা: {CalculationUtils.formatCurrency(b.advanceAmount)}
                    </div>
                    <div className="text-rose-400 font-bold">
                      বকেয়া: {CalculationUtils.formatCurrency(b.dueAmount)}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : b.paymentStatus === 'Partial'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {b.paymentStatus}
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {b.dueAmount > 0 && (
                        <button
                          onClick={() => handleOpenPayDue(b)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                          title="বকেয়া পেমেন্ট জমা করুন"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>বকেয়া জমা</span>
                        </button>
                      )}

                      <button
                        onClick={() => onViewTicket(b)}
                        className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg cursor-pointer"
                        title="টিকিট প্রিন্ট করুন"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setEditingBooking({ ...b })}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
                        title="সম্পূর্ণ বিবরণী এডিট করুন"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteBooking(b.id, b.customerName)}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-lg cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Full Booking Edit Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveBookingEdit}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>বুকিং এডিট ও আপডেট ({editingBooking.id})</span>
              <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black">
                {editingBooking.agentName || editingBooking.bookerCode}
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">গ্রাহকের নাম *</label>
                  <input
                    type="text"
                    required
                    value={editingBooking.customerName}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, customerName: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={editingBooking.customerPhone}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, customerPhone: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">মোট ফি (Payable Amount)</label>
                  <input
                    type="number"
                    value={editingBooking.payableAmount}
                    onChange={(e) => {
                      const pay = Number(e.target.value);
                      const due = Math.max(0, pay - editingBooking.advanceAmount);
                      const ps = due === 0 ? 'Paid' : editingBooking.advanceAmount > 0 ? 'Partial' : 'Unpaid';
                      setEditingBooking({
                        ...editingBooking,
                        payableAmount: pay,
                        dueAmount: due,
                        paymentStatus: ps as PaymentStatus,
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">অগ্রিম জমা (Advance Paid)</label>
                  <input
                    type="number"
                    min="0"
                    max={editingBooking.payableAmount}
                    value={editingBooking.advanceAmount}
                    onChange={(e) => {
                      const adv = Number(e.target.value);
                      const due = Math.max(0, editingBooking.payableAmount - adv);
                      const ps = due === 0 ? 'Paid' : adv > 0 ? 'Partial' : 'Unpaid';
                      setEditingBooking({
                        ...editingBooking,
                        advanceAmount: adv,
                        dueAmount: due,
                        paymentStatus: ps as PaymentStatus,
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">সিলেক্টেড সিটসমূহ</label>
                <input
                  type="text"
                  value={editingBooking.selectedSeats.join(', ')}
                  onChange={(e) => {
                    const seatsArr = e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
                    setEditingBooking({
                      ...editingBooking,
                      selectedSeats: seatsArr,
                      seatCount: seatsArr.length,
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">অবশিষ্ট বকেয়া (Due Amount):</span>
                <span className="font-bold text-rose-400 text-sm">
                  {CalculationUtils.formatCurrency(editingBooking.dueAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs"
              >
                বুকিং সেভ করুন
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Quick Pay Due Modal */}
      {payingDueBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleConfirmDuePayment}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>বকেয়া জমা নিন ({payingDueBooking.id})</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                {payingDueBooking.customerName}
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">মোট ফি (Total Fee):</span>
                  <strong className="text-white">
                    {CalculationUtils.formatCurrency(payingDueBooking.payableAmount)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ইতিমধ্যে জমা (Paid):</span>
                  <strong className="text-emerald-400">
                    {CalculationUtils.formatCurrency(payingDueBooking.advanceAmount)}
                  </strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 text-sm">
                  <span className="text-amber-400 font-bold">বর্তমান বকেয়া (Current Due):</span>
                  <strong className="text-rose-400 font-black">
                    {CalculationUtils.formatCurrency(payingDueBooking.dueAmount)}
                  </strong>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-bold">এখন কত টাকা জমা নিতে চান? *</label>
                  <button
                    type="button"
                    onClick={() => setPayAmountInput(payingDueBooking.dueAmount)}
                    className="text-[10px] text-amber-400 hover:underline font-bold"
                  >
                    সব পরিশোধ (৳{payingDueBooking.dueAmount})
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  max={payingDueBooking.dueAmount}
                  required
                  value={payAmountInput || ''}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  placeholder="e.g. 500, 1000 or full due"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 text-base font-black focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Summary Calculation Preview */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">নতুন মোট জমা হবে:</span>
                  <span className="font-bold text-emerald-400">
                    {CalculationUtils.formatCurrency(payingDueBooking.advanceAmount + (payAmountInput || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">পেমেন্ট এর পর অবশিষ্ট বকেয়া:</span>
                  <span className="font-bold text-rose-400">
                    {CalculationUtils.formatCurrency(
                      Math.max(0, payingDueBooking.dueAmount - (payAmountInput || 0))
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setPayingDueBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={payAmountInput <= 0}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>পেমেন্ট সাবমিট করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
