import { supabase } from '../lib/supabase';
import { SupabaseService } from './supabaseService';
import { StorageService } from './storage';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface HeldSeatInfo {
  agentId: string;
  agentName: string;
  timestamp: number;
}

export type HeldSeatsMap = Record<string, HeldSeatInfo>;

class RealtimeServiceManager {
  private globalBookingsChannel: RealtimeChannel | null = null;
  private tourChannels: Map<string, RealtimeChannel> = new Map();
  private clientId: string = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  getClientId(): string {
    return this.clientId;
  }

  // Listen to Postgres changes for bookings table globally
  initGlobalBookingsSubscription(onSyncNeeded?: () => void): () => void {
    if (this.globalBookingsChannel) return () => {};

    try {
      this.globalBookingsChannel = supabase
        .channel('global_bookings_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          async (payload) => {
            console.log('⚡ Realtime WebSocket: Bookings updated in Supabase DB', payload);
            if (payload.eventType === 'INSERT' && payload.new) {
              const newRow = payload.new as any;
              let seats: string[] = [];
              try {
                seats = typeof newRow.selected_seats === 'string'
                  ? JSON.parse(newRow.selected_seats)
                  : newRow.selected_seats || [];
              } catch {
                seats = [];
              }

              StorageService.addNotification({
                id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                bookingId: newRow.id,
                customerName: newRow.customer_name || 'নতুন গ্রাহক',
                customerPhone: newRow.customer_phone,
                seats: Array.isArray(seats) ? seats : [],
                totalAmount: Number(newRow.payable_amount || newRow.total_fee || 0),
                agentName: newRow.agent_name || newRow.booker_code || 'এজেন্ট',
                createdAt: newRow.created_at || new Date().toISOString(),
                isRead: false,
              });
            }
            await StorageService.syncFromSupabase();
            if (onSyncNeeded) onSyncNeeded();
            window.dispatchEvent(new Event('tour_lagbe_storage_updated'));
          }
        )
        .subscribe((status) => {
          console.log('📡 Supabase Realtime Bookings channel status:', status);
        });
    } catch (err) {
      console.warn('Realtime subscription init warning:', err);
    }

    return () => {
      if (this.globalBookingsChannel) {
        supabase.removeChannel(this.globalBookingsChannel);
        this.globalBookingsChannel = null;
      }
    };
  }

  // Join seat locking channel for a specific tour
  joinTourSeatLockChannel(
    tourId: string,
    agentId: string,
    agentName: string,
    onHeldSeatsUpdate: (heldMap: HeldSeatsMap) => void
  ): RealtimeChannel {
    const channelName = `seat_lock_${tourId}`;

    // Clean up existing if present
    if (this.tourChannels.has(tourId)) {
      this.leaveTourSeatLockChannel(tourId);
    }

    const myAgentId = agentId || this.clientId;
    const myAgentName = agentName || 'এজেন্ট';

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: myAgentId },
        broadcast: { self: false },
      },
    });

    const updatePresenceMap = () => {
      const state = channel.presenceState();
      const heldMap: HeldSeatsMap = {};

      Object.keys(state).forEach((key) => {
        const presences = state[key] as any[];
        presences.forEach((p) => {
          if (p.agentId !== myAgentId && Array.isArray(p.heldSeats)) {
            p.heldSeats.forEach((seatLabel: string) => {
              heldMap[seatLabel] = {
                agentId: p.agentId,
                agentName: p.agentName || 'অন্য এজেন্ট',
                timestamp: p.timestamp || Date.now(),
              };
            });
          }
        });
      });

      onHeldSeatsUpdate(heldMap);
    };

    channel
      .on('presence', { event: 'sync' }, updatePresenceMap)
      .on('presence', { event: 'join' }, updatePresenceMap)
      .on('presence', { event: 'leave' }, updatePresenceMap)
      .on('broadcast', { event: 'seat_hold' }, () => {
        updatePresenceMap();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            agentId: myAgentId,
            agentName: myAgentName,
            heldSeats: [],
            timestamp: Date.now(),
          });
        }
      });

    this.tourChannels.set(tourId, channel);
    return channel;
  }

  // Update currently held seats for active agent
  async updateHeldSeats(
    tourId: string,
    selectedSeats: string[],
    agentId: string,
    agentName: string
  ) {
    const channel = this.tourChannels.get(tourId);
    if (!channel) return;

    const myAgentId = agentId || this.clientId;
    const myAgentName = agentName || 'এজেন্ট';

    try {
      await channel.track({
        agentId: myAgentId,
        agentName: myAgentName,
        heldSeats: selectedSeats,
        timestamp: Date.now(),
      });

      await channel.send({
        type: 'broadcast',
        event: 'seat_hold',
        payload: {
          agentId: myAgentId,
          agentName: myAgentName,
          heldSeats: selectedSeats,
          tourId,
        },
      });
    } catch (err) {
      console.warn('Error broadcasting seat hold update:', err);
    }
  }

  // Leave tour channel
  leaveTourSeatLockChannel(tourId: string) {
    const channel = this.tourChannels.get(tourId);
    if (channel) {
      try {
        channel.untrack();
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn('Error leaving channel:', err);
      }
      this.tourChannels.delete(tourId);
    }
  }

  // Pre-check for double-booking conflict right before saving
  async checkDoubleBookingConflict(
    tourId: string,
    seatsToBook: string[]
  ): Promise<{ hasConflict: boolean; conflictingSeats: string[] }> {
    try {
      const freshBookings = await SupabaseService.fetchBookings();
      if (!freshBookings) return { hasConflict: false, conflictingSeats: [] };

      const activeBookingsForTour = freshBookings.filter(
        (b) => b.tourId === tourId && b.bookingStatus !== 'Cancelled'
      );

      const alreadyBookedSeats = new Set<string>();
      activeBookingsForTour.forEach((b) => {
        b.selectedSeats.forEach((seat) => alreadyBookedSeats.add(seat));
      });

      const conflictingSeats = seatsToBook.filter((seat) => alreadyBookedSeats.has(seat));

      return {
        hasConflict: conflictingSeats.length > 0,
        conflictingSeats,
      };
    } catch (e) {
      return { hasConflict: false, conflictingSeats: [] };
    }
  }
}

export const RealtimeService = new RealtimeServiceManager();
