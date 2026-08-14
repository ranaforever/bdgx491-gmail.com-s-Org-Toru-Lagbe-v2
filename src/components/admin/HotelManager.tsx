import React, { useState } from 'react';
import { Hotel, HotelRoom, RoomType, UserSession } from '../../types';
import { StorageService } from '../../services/storage';
import { CSVExportService } from '../../utils/csvExport';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  Plus,
  BedDouble,
  Users,
  CheckCircle2,
  Trash2,
  Edit2,
  MapPin,
  Phone,
  ShieldAlert,
  Download,
} from 'lucide-react';

interface HotelManagerProps {
  session?: UserSession | null;
}

export const HotelManager: React.FC<HotelManagerProps> = ({ session }) => {
  const { showToast } = useToast();
  const isAdmin = session?.role === 'admin';
  const [hotels, setHotels] = useState<Hotel[]>(StorageService.getHotels());
  const tours = StorageService.getTours();

  const [activeHotelId, setActiveHotelId] = useState<string>(hotels[0]?.id || '');
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const [editingHotel, setEditingHotel] = useState<Partial<Hotel>>({});
  const [editingRoom, setEditingRoom] = useState<Partial<HotelRoom>>({});

  const currentHotel = hotels.find((h) => h.id === activeHotelId) || hotels[0];

  // Hotel CRUD
  const handleOpenNewHotel = () => {
    setEditingHotel({
      id: `htl-${Date.now()}`,
      name: '',
      address: '',
      phone: '',
      totalRooms: 0,
      rooms: [],
    });
    setIsHotelModalOpen(true);
  };

  const handleEditHotel = (hotel: Hotel) => {
    setEditingHotel({ ...hotel });
    setIsHotelModalOpen(true);
  };

  const handleDeleteHotel = (hotelId: string, hotelName: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${hotelName}" হোটেলটি স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      StorageService.deleteHotel(hotelId);
      const remaining = StorageService.getHotels();
      setHotels(remaining);
      if (activeHotelId === hotelId && remaining.length > 0) {
        setActiveHotelId(remaining[0].id);
      }
      showToast(`"${hotelName}" হোটেল স্থায়ীভাবে মুছে ফেলা হয়েছে!`, 'info');
    }
  };

  const handleSaveHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel.name) return;

    const hotelObj = editingHotel as Hotel;
    let updated: Hotel[];
    if (hotels.some((h) => h.id === hotelObj.id)) {
      updated = hotels.map((h) => (h.id === hotelObj.id ? hotelObj : h));
    } else {
      updated = [...hotels, hotelObj];
    }

    setHotels(updated);
    StorageService.saveHotels(updated);
    setActiveHotelId(hotelObj.id);
    setIsHotelModalOpen(false);
    showToast('হোটেলের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!', 'success');
  };

  // Room CRUD inside Active Hotel
  const handleOpenNewRoom = () => {
    if (!currentHotel) return;
    setEditingRoom({
      id: `rm-${Date.now()}`,
      hotelId: currentHotel.id,
      roomNumber: `${(currentHotel.rooms.length + 1) * 101}`,
      roomType: 'Combined',
      capacity: 4,
      assignedPassengerIds: [],
      status: 'Available',
    });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHotel || !editingRoom.roomNumber) return;

    const roomObj = editingRoom as HotelRoom;
    const existingRooms = currentHotel.rooms || [];

    let updatedRooms: HotelRoom[];
    if (existingRooms.some((r) => r.id === roomObj.id)) {
      updatedRooms = existingRooms.map((r) => (r.id === roomObj.id ? roomObj : r));
    } else {
      updatedRooms = [...existingRooms, roomObj];
    }

    const updatedHotel: Hotel = {
      ...currentHotel,
      rooms: updatedRooms,
      totalRooms: updatedRooms.length,
    };

    const updatedHotels = hotels.map((h) => (h.id === currentHotel.id ? updatedHotel : h));
    setHotels(updatedHotels);
    StorageService.saveHotels(updatedHotels);
    setIsRoomModalOpen(false);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!currentHotel) return;
    if (confirm('আপনি কি নিশ্চিত যে এই রুমটি ডিলিট করতে চান?')) {
      const updatedRooms = currentHotel.rooms.filter((r) => r.id !== roomId);
      const updatedHotel = { ...currentHotel, rooms: updatedRooms, totalRooms: updatedRooms.length };
      const updatedHotels = hotels.map((h) => (h.id === currentHotel.id ? updatedHotel : h));
      setHotels(updatedHotels);
      StorageService.saveHotels(updatedHotels);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            হোটেল ও রুম অ্যাডমিনিস্ট্রেশন
          </span>
          <h1 className="text-xl font-black text-white mt-1">
            হোটেল ও রুম তৈরি ও কনফিগারেশন
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => CSVExportService.exportHotels(hotels)}
            className="px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            title="CSV ডাউনলোড করুন"
          >
            <Download className="w-4 h-4" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          {isAdmin ? (
            <button
              onClick={handleOpenNewHotel}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন হোটেল যুক্ত করুন</span>
            </button>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5 text-amber-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>এডমিন এক্সেস প্রয়োজন</span>
            </div>
          )}
        </div>
      </div>

      {/* Hotel Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {hotels.map((h) => (
          <button
            key={h.id}
            onClick={() => setActiveHotelId(h.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeHotelId === h.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{h.name}</span>
            <span className="bg-slate-950/20 text-current text-[10px] px-2 py-0.5 rounded-full font-black">
              {h.rooms?.length || 0} টি রুম
            </span>
          </button>
        ))}
      </div>

      {/* Active Hotel Details & Room Grid */}
      {currentHotel ? (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-lg font-black text-white">{currentHotel.name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentHotel.address}</span>
                </div>
                {currentHotel.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentHotel.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 self-start flex-wrap">
                <button
                  onClick={() => handleEditHotel(currentHotel)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  title="হোটেলের নাম ও ঠিকানা এডিট করুন"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>হোটেল এডিট</span>
                </button>

                <button
                  onClick={() => handleDeleteHotel(currentHotel.id, currentHotel.name)}
                  className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  title="হোটেল ডিলিট করুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>হোটেল ডিলিট</span>
                </button>

                <button
                  onClick={handleOpenNewRoom}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন রুম যুক্ত করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentHotel.rooms.map((room) => {
              const assignedCount = room.assignedPassengerIds.length;
              const isFull = assignedCount >= room.capacity;

              return (
                <div
                  key={room.id}
                  className={`bg-slate-900 border rounded-2xl p-4 shadow-xl space-y-3 relative ${
                    isFull ? 'border-rose-800/80' : assignedCount > 0 ? 'border-amber-800/80' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                      রুম {room.roomNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        room.roomType === 'Couple'
                          ? 'bg-pink-500/20 text-pink-300'
                          : room.roomType === 'Family'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {room.roomType}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ক্যাপাসিটি:</span>
                      <span className="font-bold">{room.capacity} জন</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">বর্তমান যাত্রী:</span>
                      <span
                        className={`font-black ${
                          isFull ? 'text-rose-400' : assignedCount > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {assignedCount} / {room.capacity}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isFull
                          ? 'bg-rose-950 text-rose-300'
                          : assignedCount > 0
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-emerald-950 text-emerald-300'
                      }`}
                    >
                      {isFull ? '🔴 ফুল (Full)' : assignedCount > 0 ? '🟡 আংশিক' : '🟢 ফাঁকা'}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">কোনো হোটেল পাওয়া যায়নি</div>
      )}

      {/* Hotel Create Modal */}
      {isHotelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveHotel}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>নতুন হোটেল যুক্ত করুন</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">হোটেলের নাম *</label>
                <input
                  type="text"
                  required
                  value={editingHotel.name || ''}
                  onChange={(e) => setEditingHotel({ ...editingHotel, name: e.target.value })}
                  placeholder="e.g. Sea Gull Hotel, Cox's Bazar"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ঠিকানা (Address)</label>
                <input
                  type="text"
                  value={editingHotel.address || ''}
                  onChange={(e) => setEditingHotel({ ...editingHotel, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ফোন নম্বর</label>
                <input
                  type="text"
                  value={editingHotel.phone || ''}
                  onChange={(e) => setEditingHotel({ ...editingHotel, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsHotelModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Room Create Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveRoom}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-emerald-400" />
              <span>হোটেলের নতুন রুম যুক্ত করুন</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">রুম নম্বর *</label>
                <input
                  type="text"
                  required
                  value={editingRoom.roomNumber || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, roomNumber: e.target.value })}
                  placeholder="e.g. 101, 202"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">রুমের টাইপ (Room Type)</label>
                <select
                  value={editingRoom.roomType || 'Combined'}
                  onChange={(e) => {
                    const rt = e.target.value as RoomType;
                    const defaultCap = rt === 'Couple' ? 2 : rt === 'Single' ? 1 : 4;
                    setEditingRoom({ ...editingRoom, roomType: rt, capacity: defaultCap });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Combined">Combined Room (সাধারণ শেয়ারিং)</option>
                  <option value="Couple">Couple Room (দম্পতি রুম)</option>
                  <option value="Family">Family Room (ফ্যামিলি রুম)</option>
                  <option value="Single">Single VIP Room</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">রুমের সিট/যাত্রী ধারণক্ষমতা (Capacity)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={editingRoom.capacity || 4}
                  onChange={(e) => setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
