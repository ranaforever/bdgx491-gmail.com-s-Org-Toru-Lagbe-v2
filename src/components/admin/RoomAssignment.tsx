import React, { useState } from 'react';
import {
  Hotel,
  HotelRoom,
  Booking,
  Passenger,
  Tour,
  Agent,
  UserSession,
} from '../../types';
import { StorageService } from '../../services/storage';
import { CalculationUtils } from '../../utils/calculations';
import { CSVExportService } from '../../utils/csvExport';
import {
  BedDouble,
  Building2,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  UserCheck,
  Filter,
  Download,
} from 'lucide-react';

interface RoomAssignmentProps {
  session?: UserSession | null;
}

export const RoomAssignment: React.FC<RoomAssignmentProps> = ({ session }) => {
  const tours = StorageService.getTours();
  const [hotels, setHotels] = useState<Hotel[]>(StorageService.getHotels());
  const bookings = StorageService.getBookings();
  const agents = StorageService.getAgents();

  const sessionAgent = agents.find(
    (a) => a.code.toUpperCase() === session?.agentCode?.toUpperCase()
  );

  const [selectedTourId, setSelectedTourId] = useState<string>(tours[0]?.id || '');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [searchPassenger, setSearchPassenger] = useState<string>('');

  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    hotelId: string;
    room: HotelRoom | null;
  }>({
    isOpen: false,
    hotelId: '',
    room: null,
  });

  const [selectedPassengerIdsToAssign, setSelectedPassengerIdsToAssign] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentTour = tours.find((t) => t.id === selectedTourId) || tours[0];
  const currentHotels = currentTour?.hotelId
    ? hotels.filter((h) => h.id === currentTour.hotelId)
    : hotels;

  // Hotel Summary Dashboard Stats
  const stats = CalculationUtils.getHotelSummaryStats(hotels, bookings, selectedTourId);

  // Unassigned passengers for this tour
  const unassignedList = CalculationUtils.getUnassignedPassengers(
    selectedTourId,
    bookings,
    hotels
  );

  // Filtered unassigned list based on search and agent
  const filteredUnassigned = unassignedList.filter((item) => {
    // If agent logged in, only show own passengers
    if (session?.role === 'agent') {
      const isMine =
        item.booking.agentId === sessionAgent?.id ||
        item.booking.bookerCode?.toUpperCase() === session?.agentCode?.toUpperCase();
      if (!isMine) return false;
    }

    const matchesAgent = selectedAgentId === 'all' || item.booking.agentId === selectedAgentId;
    const matchesQuery =
      searchPassenger === '' ||
      item.passenger.name.toLowerCase().includes(searchPassenger.toLowerCase()) ||
      item.passenger.phone.includes(searchPassenger) ||
      item.passenger.seatNumber.toLowerCase().includes(searchPassenger.toLowerCase());
    return matchesAgent && matchesQuery;
  });

  // Open Room Assignment Modal
  const handleOpenAssignModal = (hotelId: string, room: HotelRoom) => {
    setAssignModal({ isOpen: true, hotelId, room });
    setSelectedPassengerIdsToAssign([]);
    setErrorMessage('');
  };

  // Toggle passenger selection for room
  const handleTogglePassengerSelection = (pId: string) => {
    if (selectedPassengerIdsToAssign.includes(pId)) {
      setSelectedPassengerIdsToAssign(selectedPassengerIdsToAssign.filter((id) => id !== pId));
    } else {
      const room = assignModal.room;
      if (!room) return;
      const currentAssignedCount = room.assignedPassengerIds.length;
      if (currentAssignedCount + selectedPassengerIdsToAssign.length + 1 > room.capacity) {
        setErrorMessage(`রুমের ক্যাপাসিটি ${room.capacity} জনের বেশি দেওয়া সম্ভব নয়!`);
        return;
      }
      setErrorMessage('');
      setSelectedPassengerIdsToAssign([...selectedPassengerIdsToAssign, pId]);
    }
  };

  // Save room assignment
  const handleConfirmAssignment = () => {
    if (!assignModal.room || selectedPassengerIdsToAssign.length === 0) return;

    const room = assignModal.room;
    const newAssignedList = Array.from(
      new Set([...room.assignedPassengerIds, ...selectedPassengerIdsToAssign])
    );

    const updatedStatus =
      newAssignedList.length >= room.capacity ? 'Occupied' : 'Partially Filled';

    const updatedRoom: HotelRoom = {
      ...room,
      assignedPassengerIds: newAssignedList,
      status: updatedStatus,
    };

    // Update state & storage
    const updatedHotels = hotels.map((h) => {
      if (h.id === assignModal.hotelId) {
        const updatedRooms = h.rooms.map((r) => (r.id === room.id ? updatedRoom : r));
        return { ...h, rooms: updatedRooms };
      }
      return h;
    });

    setHotels(updatedHotels);
    StorageService.saveHotels(updatedHotels);
    setAssignModal({ isOpen: false, hotelId: '', room: null });
  };

  // Remove assigned passenger from room
  const handleRemovePassengerFromRoom = (hotelId: string, roomId: string, passengerId: string) => {
    const updatedHotels = hotels.map((h) => {
      if (h.id === hotelId) {
        const updatedRooms = h.rooms.map((r) => {
          if (r.id === roomId) {
            const remaining = r.assignedPassengerIds.filter((id) => id !== passengerId);
            return {
              ...r,
              assignedPassengerIds: remaining,
              status: remaining.length === 0 ? 'Available' : 'Partially Filled',
            };
          }
          return r;
        });
        return { ...h, rooms: updatedRooms };
      }
      return h;
    });

    setHotels(updatedHotels);
    StorageService.saveHotels(updatedHotels);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              হোটেল সিট ও রুম বরাদ্দ
            </span>
            <h1 className="text-xl font-black text-white mt-1">
              প্যাসেঞ্জার রুম অ্যাসাইনমেন্ট ইঞ্জিন
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => CSVExportService.exportRoomAssignments(hotels, bookings)}
              className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              title="রুম অ্যাসাইনমেন্ট CSV রিপোর্ট ডাউনলোড করুন"
            >
              <Download className="w-4 h-4" />
              <span>CSV এক্সপোর্ট</span>
            </button>

            <select
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500"
            >
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Day Long Tour Warning Banner */}
        {currentTour?.tourCategory === 'Day Long' && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl p-4 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="block text-sm text-amber-200">☀️ ডে-লং (Day Long) ট্যুর নির্বাচন করা হয়েছে</strong>
              <span>এই ট্যুরে রাত্রিকালীন অবস্থানের প্রয়োজন নেই, তাই হোটেল বা রুম অ্যাসাইনমেন্ট প্রযোজ্য নয়।</span>
            </div>
          </div>
        )}

        {/* Dashboard KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 border-t border-slate-800 pt-4 text-xs">
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700">
            <span className="text-slate-400 block text-[10px]">মোট রুম</span>
            <span className="text-base font-black text-white">{stats.totalRooms} টি</span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700">
            <span className="text-slate-400 block text-[10px]">ফুল (Occupied)</span>
            <span className="text-base font-black text-rose-400">{stats.occupiedRooms} টি</span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700">
            <span className="text-slate-400 block text-[10px]">ফাঁকা (Available)</span>
            <span className="text-base font-black text-emerald-400">{stats.availableRooms} টি</span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700">
            <span className="text-slate-400 block text-[10px]">কম্বাইন্ড রুম</span>
            <span className="text-base font-black text-sky-400">{stats.combinedCount} টি</span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700">
            <span className="text-slate-400 block text-[10px]">কাপল রুম</span>
            <span className="text-base font-black text-pink-400">{stats.coupleCount} টি</span>
          </div>

          <div className="bg-amber-950/40 rounded-2xl p-3 border border-amber-800/60">
            <span className="text-amber-400 block text-[10px] font-bold">রুম বাকি যাত্রী</span>
            <span className="text-base font-black text-amber-300 animate-pulse">
              {stats.unassignedCount} জন ⚠️
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Hotel Room Grid, Right Unassigned Passengers List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Hotel Room Grid */}
        <div className="lg:col-span-7 space-y-6">
          {currentHotels.map((hotel) => (
            <div key={hotel.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <span>{hotel.name}</span>
                </h3>
                <span className="text-xs text-slate-400 font-semibold">{hotel.address}</span>
              </div>

              {/* Rooms List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hotel.rooms.map((room) => {
                  const isFull = room.assignedPassengerIds.length >= room.capacity;
                  const allPassengers = StorageService.getAllPassengers();
                  const assignedPassengers = allPassengers.filter((p) =>
                    room.assignedPassengerIds.includes(p.id)
                  );

                  return (
                    <div
                      key={room.id}
                      className={`bg-slate-800/60 border rounded-2xl p-4 space-y-3 ${
                        isFull ? 'border-rose-800/80' : 'border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                          রুম {room.roomNumber} ({room.roomType})
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {room.assignedPassengerIds.length} / {room.capacity}
                        </span>
                      </div>

                      {/* Assigned Passenger List in this room */}
                      <div className="space-y-1.5 min-h-[60px] bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 text-xs">
                        {assignedPassengers.length === 0 ? (
                          <span className="text-slate-500 text-[11px] italic block text-center py-2">
                            কেউ অ্যাসাইনড নেই (ফাঁকা রুম)
                          </span>
                        ) : (
                          assignedPassengers.map((psg) => (
                            <div
                              key={psg.id}
                              className="flex items-center justify-between bg-slate-900 p-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-200"
                            >
                              <span>
                                {psg.name} (সিট: <strong className="text-emerald-400">{psg.seatNumber}</strong>)
                              </span>
                              <button
                                onClick={() => handleRemovePassengerFromRoom(hotel.id, room.id, psg.id)}
                                className="text-slate-500 hover:text-rose-400 p-0.5"
                                title="রুম থেকে অপসারন করুন"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <button
                        disabled={isFull}
                        onClick={() => handleOpenAssignModal(hotel.id, room)}
                        className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isFull ? 'রুম সম্পূর্ণ ফুল' : 'যাত্রী যুক্ত করুন'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Unassigned Passengers Sidebar List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>হোটেল রুম বাকি থাকা যাত্রী ({filteredUnassigned.length} জন)</span>
              </h3>
            </div>

            {/* Filter controls */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchPassenger}
                  onChange={(e) => setSearchPassenger(e.target.value)}
                  placeholder="যাত্রীর নাম / ফোন / সিট দিয়ে খুঁজুন..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="all">সকল এজেন্ট / বুকার (All Agents)</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.agencyName} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Unassigned Cards Scrollable */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredUnassigned.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  সকল যাত্রীকে রুম দেওয়া সম্পন্ন হয়েছে! 🎉
                </div>
              ) : (
                filteredUnassigned.map(({ passenger: psg, booking: bk }) => (
                  <div
                    key={psg.id}
                    className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 space-y-1 text-xs text-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{psg.name}</span>
                      <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded">
                        সিট: {psg.seatNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>ফোন: {psg.phone || 'N/A'}</span>
                      <span className="text-amber-400 font-semibold">{bk.groupType} Group</span>
                    </div>

                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700/50">
                      এজেন্ট: {bk.agentName || bk.bookerCode} | বুকিং আইডি: {bk.id}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal.isOpen && assignModal.room && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>রুম {assignModal.room.roomNumber} - এ যাত্রী যুক্ত করুন</span>
              <span className="text-xs text-emerald-400 font-bold">
                ধারণক্ষমতা: {assignModal.room.capacity} জন
              </span>
            </h3>

            {errorMessage && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-2.5 rounded-xl font-semibold">
                ⚠️ {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                নিচের তালিকা হতে যাত্রীদের টিক মার্ক করে রুম সিলেক্ট করুন:
              </label>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredUnassigned.map(({ passenger: psg }) => {
                  const isChecked = selectedPassengerIdsToAssign.includes(psg.id);
                  return (
                    <div
                      key={psg.id}
                      onClick={() => handleTogglePassengerSelection(psg.id)}
                      className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-emerald-950/80 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <span className="font-bold block">{psg.name}</span>
                        <span className="text-[11px] text-slate-400">
                          লিঙ্গ: {psg.gender} | ধর্ম: {psg.religion}
                        </span>
                      </div>
                      <span className="bg-slate-900 px-2 py-1 rounded font-mono font-bold text-emerald-400 text-[11px]">
                        সিট: {psg.seatNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setAssignModal({ isOpen: false, hotelId: '', room: null })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={selectedPassengerIdsToAssign.length === 0}
                onClick={handleConfirmAssignment}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs disabled:opacity-40"
              >
                অ্যাসাইন কনফার্ম করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
