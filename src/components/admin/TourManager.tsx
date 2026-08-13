import React, { useState } from 'react';
import { Tour, BusType, TourStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { CalculationUtils } from '../../utils/calculations';
import { CSVExportService } from '../../utils/csvExport';
import {
  Plus,
  Edit2,
  Trash2,
  Compass,
  Calendar,
  Bus,
  Building2,
  CheckCircle2,
  Search,
  Download,
} from 'lucide-react';

export const TourManager: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>(StorageService.getTours());
  const templates = StorageService.getTemplates();
  const hotels = StorageService.getHotels();
  const agents = StorageService.getAgents();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Partial<Tour> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenCreate = () => {
    setEditingTour({
      id: `tour-${Date.now()}`,
      name: '',
      type: 'Beach Resort & Cruise',
      tourCategory: 'Relax',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      fee: 4000,
      discountAllowed: 300,
      busType: 'AC',
      layoutTemplateId: templates[0]?.id || '',
      totalSeats: 40,
      hotelId: hotels[0]?.id || '',
      agentIds: agents.map((a) => a.id),
      status: 'Upcoming',
      description: '',
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tour: Tour) => {
    setEditingTour({ ...tour });
    setIsModalOpen(true);
  };

  const handleSaveTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTour?.name || !editingTour.startDate) return;

    const tourToSave = editingTour as Tour;
    let updated: Tour[];
    if (tours.some((t) => t.id === tourToSave.id)) {
      updated = tours.map((t) => (t.id === tourToSave.id ? tourToSave : t));
    } else {
      updated = [tourToSave, ...tours];
    }

    setTours(updated);
    StorageService.saveTours(updated);
    setIsModalOpen(false);
  };

  const handleDeleteTour = (tourId: string) => {
    if (confirm('আপনি কি নিশ্চিত যে আপনি এই ট্যুরটি ডিলিট করতে চান?')) {
      const updated = tours.filter((t) => t.id !== tourId);
      setTours(updated);
      StorageService.saveTours(updated);
    }
  };

  const filteredTours = tours.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            ট্যুর প্যাকেজ ম্যানেজমেন্ট
          </span>
          <h1 className="text-xl font-black text-white mt-1">
            ট্যুর ও বাসের প্যাকেজ কনফিগারেশন
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => CSVExportService.exportTours(filteredTours)}
            className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            title="CSV ডাউনলোড করুন"
          >
            <Download className="w-4 h-4" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ট্যুর প্যাকেজ এড করুন</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ট্যুরের নাম দিয়ে খুঁজুন..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Tour Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTours.map((tour) => {
          const linkedHotel = hotels.find((h) => h.id === tour.hotelId);
          const layout = templates.find((l) => l.id === tour.layoutTemplateId);

          return (
            <div
              key={tour.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        tour.tourCategory === 'Day Long'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}
                    >
                      {tour.tourCategory === 'Day Long' ? '☀️ Day Long' : '🌴 Relax Tour'}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {tour.type}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tour.status === 'Upcoming'
                        ? 'bg-sky-500/20 text-sky-400'
                        : tour.status === 'Completed'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {tour.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">{tour.name}</h3>

                <div className="space-y-2 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {tour.startDate} হতে {tour.endDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Bus className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>
                      {tour.busType} Bus ({layout?.name || 'Standard Layout'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {tour.tourCategory === 'Day Long'
                        ? 'হোটেল প্রযোজ্য নয় (Day Long)'
                        : linkedHotel?.name || 'হোটেল যুক্ত করা হয়নি'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">ফি প্রতি জন</span>
                  <span className="text-base font-black text-emerald-400">
                    {CalculationUtils.formatCurrency(tour.fee)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(tour)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
                    title="এডিট করুন"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTour(tour.id)}
                    className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-xl transition-colors"
                    title="ডিলিট করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tour Create / Edit Modal */}
      {isModalOpen && editingTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveTour}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              <span>ট্যুর প্যাকেজ তথ্য কনফিগার করুন</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ট্যুর টাইপ (Tour Type) *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingTour({ ...editingTour, tourCategory: 'Relax' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      editingTour.tourCategory !== 'Day Long'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>🌴 Relax Tour</span>
                    <span className="text-[10px] opacity-75">(হোটেল প্রযোজ্য)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingTour({ ...editingTour, tourCategory: 'Day Long', hotelId: '' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      editingTour.tourCategory === 'Day Long'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>☀️ Day Long</span>
                    <span className="text-[10px] opacity-75">(হোটেল ছাড়া)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ট্যুরের নাম *</label>
                <input
                  type="text"
                  required
                  value={editingTour.name || ''}
                  onChange={(e) => setEditingTour({ ...editingTour, name: e.target.value })}
                  placeholder="e.g. Cox's Bazar Sea Beach Mega Tour"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ট্যুর ক্যাটাগরি</label>
                  <input
                    type="text"
                    value={editingTour.type || ''}
                    onChange={(e) => setEditingTour({ ...editingTour, type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">স্ট্যাটাস</label>
                  <select
                    value={editingTour.status || 'Upcoming'}
                    onChange={(e) => setEditingTour({ ...editingTour, status: e.target.value as TourStatus })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">যাত্রার তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={editingTour.startDate || ''}
                    onChange={(e) => setEditingTour({ ...editingTour, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ফেরার তারিখ</label>
                  <input
                    type="date"
                    value={editingTour.endDate || ''}
                    onChange={(e) => setEditingTour({ ...editingTour, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ট্যুর ফি (প্রতি জন) *</label>
                  <input
                    type="number"
                    required
                    value={editingTour.fee || 0}
                    onChange={(e) => setEditingTour({ ...editingTour, fee: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">সর্বোচ্চ ছাড়</label>
                  <input
                    type="number"
                    value={editingTour.discountAllowed || 0}
                    onChange={(e) => setEditingTour({ ...editingTour, discountAllowed: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">বাসের ক্যাটাগরি (AC / Non-AC)</label>
                  <select
                    value={editingTour.busType || 'AC'}
                    onChange={(e) => setEditingTour({ ...editingTour, busType: e.target.value as BusType })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="AC">AC Bus</option>
                    <option value="Non-AC">Non-AC Bus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">বাসের সিট লেআউট টেমপ্লেট</label>
                  <select
                    value={editingTour.layoutTemplateId || ''}
                    onChange={(e) => {
                      const tmpl = templates.find((t) => t.id === e.target.value);
                      setEditingTour({
                        ...editingTour,
                        layoutTemplateId: e.target.value,
                        totalSeats: tmpl?.totalSeats || 40,
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.busType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">সংযুক্ত হোটেল</label>
                {editingTour.tourCategory === 'Day Long' ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-3 text-xs flex items-center justify-between">
                    <span>☀️ ডে-লং (Day Long) ট্যুরের জন্য হোটেল প্রযোজ্য নয়।</span>
                    <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-bold">N/A</span>
                  </div>
                ) : (
                  <select
                    value={editingTour.hotelId || ''}
                    onChange={(e) => setEditingTour({ ...editingTour, hotelId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">কোনো হোটেল যুক্ত নেই</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
