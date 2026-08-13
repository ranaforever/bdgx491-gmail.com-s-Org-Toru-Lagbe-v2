import React, { useState } from 'react';
import { BusLayoutTemplate, BusSeat, SeatType, BusType } from '../../types';
import { StorageService } from '../../services/storage';
import { SeatMap } from '../booking/SeatMap';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  Bus,
  Plus,
  Trash2,
  Copy,
  Save,
  CheckCircle2,
  AlertTriangle,
  Move,
  Grid,
  Edit3,
} from 'lucide-react';

export const BusLayoutBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<BusLayoutTemplate[]>(StorageService.getTemplates());
  const allBookings = StorageService.getBookings();

  const [activeTemplateId, setActiveTemplateId] = useState<string>(templates[0]?.id || '');
  const currentTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];

  // Editable layout state
  const [editingLayout, setEditingLayout] = useState<BusLayoutTemplate>(
    currentTemplate || {
      id: `tmpl-${Date.now()}`,
      name: 'New Custom Bus Layout',
      busType: 'AC',
      totalSeats: 40,
      rows: 10,
      cols: 5,
      aisleCol: 3,
      hasDriver: true,
      hasDoor: true,
      seats: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  const [selectedSeat, setSelectedSeat] = useState<BusSeat | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string>('');

  // Confirmation modal state for seat deletion
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    seatToDelete: BusSeat | null;
    bookingCount: number;
  }>({
    isOpen: false,
    seatToDelete: null,
    bookingCount: 0,
  });

  const handleSelectTemplate = (id: string) => {
    setActiveTemplateId(id);
    const tmpl = templates.find((t) => t.id === id);
    if (tmpl) setEditingLayout(JSON.parse(JSON.stringify(tmpl)));
  };

  // Check how many bookings rely on a specific seat label
  const countSeatBookings = (seatLabel: string): number => {
    return allBookings.filter(
      (b) => b.bookingStatus !== 'Cancelled' && b.selectedSeats.includes(seatLabel)
    ).length;
  };

  // Add new seat
  const handleAddSeat = (row: number, col: number) => {
    const rowLetter = String.fromCharCode(64 + row);
    const label = `${rowLetter}${col <= 2 ? col : col - 1}`;
    const newSeat: BusSeat = {
      id: `seat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label,
      row,
      col,
      type: 'Regular',
    };

    setEditingLayout((prev) => {
      const filtered = prev.seats.filter((s) => !(s.row === row && s.col === col));
      const updatedSeats = [...filtered, newSeat];
      const actualSeats = updatedSeats.filter((s) => s.type !== 'Empty' && s.type !== 'Blocked').length;
      return {
        ...prev,
        seats: updatedSeats,
        totalSeats: actualSeats,
      };
    });
  };

  // Trigger seat removal with safety warning
  const handleRequestRemoveSeat = (seat: BusSeat) => {
    const bookingCount = countSeatBookings(seat.label);
    if (bookingCount > 0) {
      setDeleteModal({
        isOpen: true,
        seatToDelete: seat,
        bookingCount,
      });
    } else {
      performRemoveSeat(seat.id);
    }
  };

  const performRemoveSeat = (seatId: string) => {
    setEditingLayout((prev) => {
      const updatedSeats = prev.seats.filter((s) => s.id !== seatId);
      const actualSeats = updatedSeats.filter((s) => s.type !== 'Empty' && s.type !== 'Blocked').length;
      return {
        ...prev,
        seats: updatedSeats,
        totalSeats: actualSeats,
      };
    });
    setSelectedSeat(null);
  };

  // Block seat instead of deleting
  const handleBlockSeat = (seat: BusSeat) => {
    setEditingLayout((prev) => {
      const updatedSeats = prev.seats.map((s) =>
        s.id === seat.id ? { ...s, isBlocked: !s.isBlocked, type: s.isBlocked ? ('Regular' as SeatType) : ('Blocked' as SeatType) } : s
      );
      return { ...prev, seats: updatedSeats };
    });
  };

  // Update selected seat properties
  const handleUpdateSeatProp = (field: keyof BusSeat, value: any) => {
    if (!selectedSeat) return;
    const updated = { ...selectedSeat, [field]: value };
    setSelectedSeat(updated);

    setEditingLayout((prev) => {
      const updatedSeats = prev.seats.map((s) => (s.id === selectedSeat.id ? updated : s));
      const actualSeats = updatedSeats.filter((s) => s.type !== 'Empty' && s.type !== 'Blocked').length;
      return {
        ...prev,
        seats: updatedSeats,
        totalSeats: actualSeats,
      };
    });
  };

  // Save template
  const handleSaveTemplate = () => {
    const updatedList = templates.map((t) => (t.id === editingLayout.id ? editingLayout : t));
    if (!templates.some((t) => t.id === editingLayout.id)) {
      updatedList.push(editingLayout);
    }
    setTemplates(updatedList);
    StorageService.saveTemplates(updatedList);
    setSaveSuccess('বাস সিট লেআউট সফলভাবে সংরক্ষিত হয়েছে!');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  // Duplicate template
  const handleDuplicateTemplate = () => {
    const dup: BusLayoutTemplate = {
      ...editingLayout,
      id: `tmpl-${Date.now()}`,
      name: `${editingLayout.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedList = [...templates, dup];
    setTemplates(updatedList);
    StorageService.saveTemplates(updatedList);
    setActiveTemplateId(dup.id);
    setEditingLayout(dup);
  };

  // Create new blank template
  const handleCreateNewTemplate = () => {
    const newTmpl: BusLayoutTemplate = {
      id: `tmpl-${Date.now()}`,
      name: 'New Custom 40 Seats Layout',
      busType: 'AC',
      totalSeats: 40,
      rows: 10,
      cols: 5,
      aisleCol: 3,
      hasDriver: true,
      hasDoor: true,
      seats: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    for (let r = 1; r <= 10; r++) {
      const letter = String.fromCharCode(64 + r);
      for (let c = 1; c <= 5; c++) {
        if (c === 3) {
          newTmpl.seats.push({ id: `s-${r}-${c}`, label: '', row: r, col: c, type: 'Empty' });
        } else {
          const seatNum = c < 3 ? c : c - 1;
          newTmpl.seats.push({ id: `s-${r}-${c}`, label: `${letter}${seatNum}`, row: r, col: c, type: 'Regular' });
        }
      }
    }

    const updatedList = [...templates, newTmpl];
    setTemplates(updatedList);
    StorageService.saveTemplates(updatedList);
    setActiveTemplateId(newTmpl.id);
    setEditingLayout(newTmpl);
  };

  // Dynamic Row and Column Grid update handler
  const handleUpdateDimensions = (newRows: number, newCols: number, newAisle: number = 3) => {
    setEditingLayout((prev) => {
      const updatedSeats: BusSeat[] = [];

      for (let r = 1; r <= newRows; r++) {
        const rowLetter = String.fromCharCode(64 + r);
        let seatNumInRow = 1;

        for (let c = 1; c <= newCols; c++) {
          const existing = prev.seats.find((s) => s.row === r && s.col === c);

          if (c === newAisle) {
            // Aisle column is empty passageway
            updatedSeats.push({
              id: existing?.id || `s-${r}-${c}`,
              label: '',
              row: r,
              col: c,
              type: 'Empty',
            });
          } else if (existing && existing.type !== 'Empty') {
            // Keep existing seat definition
            updatedSeats.push(existing);
            seatNumInRow++;
          } else {
            // Generate new seat
            const label = `${rowLetter}${seatNumInRow}`;
            updatedSeats.push({
              id: `s-${r}-${c}-${Date.now()}`,
              label,
              row: r,
              col: c,
              type: 'Regular',
            });
            seatNumInRow++;
          }
        }
      }

      const actualSeats = updatedSeats.filter((s) => s.type !== 'Empty' && s.type !== 'Blocked').length;
      return {
        ...prev,
        rows: newRows,
        cols: newCols,
        aisleCol: newAisle,
        seats: updatedSeats,
        totalSeats: actualSeats,
      };
    });
  };

  // Delete current template
  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      alert('কমপক্ষে একটি বাস লেআউট টেমপ্লেট থাকা আবশ্যক!');
      return;
    }
    if (confirm('আপনি কি নিশ্চিত যে এই লেআউট টেমপ্লেটটি মুছে ফেলতে চান?')) {
      const remaining = templates.filter((t) => t.id !== id);
      setTemplates(remaining);
      StorageService.saveTemplates(remaining);
      setActiveTemplateId(remaining[0].id);
      setEditingLayout(JSON.parse(JSON.stringify(remaining[0])));
      setSaveSuccess('লেআউট টেমপ্লেট মুছে ফেলা হয়েছে!');
      setTimeout(() => setSaveSuccess(''), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Controls & Template Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              ভিজ্যুয়াল ডিজাইনার
            </span>
            <h1 className="text-xl font-black text-white mt-1">
              বাস সিট লেআউট বিল্ডার (Custom Bus Seat Designer)
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCreateNewTemplate}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>নতুন লেআউট তৈরি করুন</span>
            </button>

            <button
              onClick={handleDuplicateTemplate}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-4 h-4 text-teal-400" />
              <span>ডুপ্লিকেট করুন</span>
            </button>

            <button
              onClick={handleSaveTemplate}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>সেভ করুন</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Template List Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-800 pt-4">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTemplateId === t.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout Editor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Interactive Canvas */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-emerald-400" />
              <span>ইন্টারেক্টিভ বাসের ভেতরের ম্যাপ ({editingLayout.totalSeats} সিট)</span>
            </h2>
            <span className="text-xs text-slate-400">গ্রিডে ক্লিক করে সিট এডিট বা নতুন এড করুন</span>
          </div>

          {/* Interactive Seat Editor Canvas */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md mx-auto space-y-4">
            {/* Front Driver Area */}
            <div className="border-b-2 border-dashed border-slate-800 pb-3 flex items-center justify-between text-xs text-slate-400 font-bold px-2">
              <span>🚪 গ্যাংওয়ে ডোর</span>
              <span>🚌 ড্রাইভার সীমানা</span>
            </div>

            {/* Rows Grid */}
            <div className="space-y-3">
              {Array.from({ length: editingLayout.rows }).map((_, rIdx) => {
                const rNum = rIdx + 1;
                return (
                  <div key={`edit-row-${rNum}`} className="flex items-center justify-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold w-4 text-right">
                      {rNum}
                    </span>

                    {Array.from({ length: editingLayout.cols }).map((_, cIdx) => {
                      const cNum = cIdx + 1;
                      const seat = editingLayout.seats.find((s) => s.row === rNum && s.col === cNum);
                      const isSelected = selectedSeat?.id === seat?.id;

                      if (!seat || seat.type === 'Empty') {
                        return (
                          <button
                            key={`empty-${rNum}-${cNum}`}
                            onClick={() => handleAddSeat(rNum, cNum)}
                            className="w-10 h-10 rounded-xl border border-dashed border-slate-800 text-slate-600 hover:text-emerald-400 hover:border-emerald-500/50 flex items-center justify-center text-xs transition-colors"
                            title="এখানে সিট যোগ করুন"
                          >
                            +
                          </button>
                        );
                      }

                      return (
                        <button
                          key={seat.id}
                          onClick={() => setSelectedSeat(seat)}
                          className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 scale-110 z-10 font-black'
                              : seat.isBlocked || seat.type === 'Blocked'
                              ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                              : seat.type === 'VIP'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                              : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-emerald-500'
                          }`}
                        >
                          <span>{seat.label}</span>
                          {seat.type === 'VIP' && <span className="text-[8px]">VIP</span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Template & Seat Property Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Template General Properties */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Edit3 className="w-4 h-4 text-teal-400" />
              <span>লেআউট সাধারণ প্রোপার্টিজ</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">লেআউটের নাম</label>
                <input
                  type="text"
                  value={editingLayout.name}
                  onChange={(e) => setEditingLayout({ ...editingLayout, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">বাস টাইপ</label>
                  <select
                    value={editingLayout.busType}
                    onChange={(e) => setEditingLayout({ ...editingLayout, busType: e.target.value as BusType })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="AC">AC Bus</option>
                    <option value="Non-AC">Non-AC Bus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">সারি সংখ্যা (Rows)</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={editingLayout.rows}
                    onChange={(e) => {
                      const r = Number(e.target.value);
                      handleUpdateDimensions(r, editingLayout.cols, editingLayout.aisleCol || 3);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">কলাম সংখ্যা (Columns)</label>
                  <input
                    type="number"
                    min="2"
                    max="7"
                    value={editingLayout.cols}
                    onChange={(e) => {
                      const c = Number(e.target.value);
                      handleUpdateDimensions(editingLayout.rows, c, editingLayout.aisleCol || 3);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">গ্যাঙওয়ে/আইল কলাম</label>
                  <select
                    value={editingLayout.aisleCol || 3}
                    onChange={(e) => {
                      const a = Number(e.target.value);
                      handleUpdateDimensions(editingLayout.rows, editingLayout.cols, a);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Array.from({ length: editingLayout.cols }).map((_, idx) => (
                      <option key={`aisle-opt-${idx + 1}`} value={idx + 1}>
                        কলাম {idx + 1} (Passageway)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Layout Presets */}
              <div className="pt-2 space-y-1.5">
                <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  লেআউট কুইক প্রিসেট (Quick Layout Presets):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateDimensions(10, 5, 3)}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-200 text-center"
                  >
                    2+2 (40 Seats)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateDimensions(9, 4, 3)}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-200 text-center"
                  >
                    2+1 (27 Seats)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateDimensions(8, 3, 2)}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-200 text-center"
                  >
                    1+1 (16 Beds)
                  </button>
                </div>
              </div>

              {/* Delete Template Action */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteTemplate(editingLayout.id)}
                  className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>এই লেআউট টেমপ্লেটটি মুছে ফেলুন (Delete)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Selected Seat Editor Card */}
          {selectedSeat ? (
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-4 bg-gradient-to-b from-amber-500/5 to-transparent">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <span>সিট প্রোপার্টিজ এডিটর ({selectedSeat.label})</span>
                </h3>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded">
                  সিলেক্টেড
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">সিট লেবেল (Seat Number)</label>
                  <input
                    type="text"
                    value={selectedSeat.label}
                    onChange={(e) => handleUpdateSeatProp('label', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">সিটের ধরন (Seat Type)</label>
                  <select
                    value={selectedSeat.type}
                    onChange={(e) => handleUpdateSeatProp('type', e.target.value as SeatType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Regular">Regular Seat</option>
                    <option value="Sleeper">Sleeper Bed</option>
                    <option value="VIP">VIP Business Seat</option>
                    <option value="Couple">Couple Special</option>
                    <option value="Blocked">Blocked / Unavailable</option>
                    <option value="Empty">Empty Space (Passageway)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleBlockSeat(selectedSeat)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs"
                  >
                    {selectedSeat.isBlocked ? 'আনব্লক করুন' : 'ব্লক / Unavailable করুন'}
                  </button>

                  <button
                    onClick={() => handleRequestRemoveSeat(selectedSeat)}
                    className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl font-bold text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>মুছে ফেলুন</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-xs text-slate-500">
              <Move className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <span>লেআউটের যেকোনো সিটে ক্লিক করে সেটির নাম ও ধরন পরিবর্তন করুন</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation modal for deleting booked seat */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="সিটটি অপসারণের ব্যাপারে সতর্কতা (Booked Seat Warning)"
        message={`সিট "${deleteModal.seatToDelete?.label}"-এর পূর্বে করা ${deleteModal.bookingCount} টি সক্রিয় বুকিং রয়েছে!`}
        warningText="ঐতিহাসিক বুকিং তথ্য যেন নষ্ট না হয়, তার জন্য সরাসরি রিমুভ না করে সিটটি 'Blocked / Unavailable' করে রাখা সুপারিশ করা হচ্ছে।"
        confirmLabel="তবুও সম্পূর্ণ রিমুভ করুন"
        cancelLabel="বাতিল করুন (ব্লক হিসেবে রাখুন)"
        onConfirm={() => {
          if (deleteModal.seatToDelete) performRemoveSeat(deleteModal.seatToDelete.id);
          setDeleteModal({ isOpen: false, seatToDelete: null, bookingCount: 0 });
        }}
        onCancel={() => {
          if (deleteModal.seatToDelete) handleBlockSeat(deleteModal.seatToDelete);
          setDeleteModal({ isOpen: false, seatToDelete: null, bookingCount: 0 });
        }}
      />
    </div>
  );
};
