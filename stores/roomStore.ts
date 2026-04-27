import { create } from 'zustand';
import { Room, CreateRoomInput } from '@/models/Room';
import * as storage from '@/services/storage';

const DEFAULT_ROOMS: CreateRoomInput[] = [
  { name: 'Living Room', emoji: '🛋️' },
  { name: 'Bedroom', emoji: '🛏️' },
  { name: 'Kitchen', emoji: '🍽️' },
  { name: 'Bathroom', emoji: '🛁' },
  { name: 'Office', emoji: '💻' },
  { name: 'Outdoor', emoji: '🌿' },
];

interface RoomStore {
  rooms: Room[];
  loading: boolean;
  initialized: boolean;

  loadRooms: () => Promise<void>;
  addRoom: (input: CreateRoomInput) => Promise<Room>;
  removeRoom: (id: string) => Promise<void>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<void>;
  getRoomById: (id: string | null | undefined) => Room | undefined;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: [],
  loading: false,
  initialized: false,

  loadRooms: async () => {
    set({ loading: true });
    let rooms = await storage.getAllRooms();

    if (rooms.length === 0 && !get().initialized) {
      for (const r of DEFAULT_ROOMS) {
        await storage.createRoom(r);
      }
      rooms = await storage.getAllRooms();
    }

    set({ rooms, loading: false, initialized: true });
  },

  addRoom: async (input) => {
    const room = await storage.createRoom(input);
    set((state) => ({ rooms: [...state.rooms, room] }));
    return room;
  },

  removeRoom: async (id) => {
    await storage.deleteRoom(id);
    set((state) => ({ rooms: state.rooms.filter((r) => r.id !== id) }));
  },

  updateRoom: async (id, updates) => {
    await storage.updateRoom(id, updates);
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  },

  getRoomById: (id) => {
    if (!id) return undefined;
    return get().rooms.find((r) => r.id === id);
  },
}));
