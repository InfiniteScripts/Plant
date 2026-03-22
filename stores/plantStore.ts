import { create } from 'zustand';
import { Plant, CreatePlantInput } from '@/models/Plant';
import * as storage from '@/services/storage';

interface PlantStore {
  plants: Plant[];
  loading: boolean;
  initialized: boolean;

  loadPlants: () => Promise<void>;
  addPlant: (input: CreatePlantInput) => Promise<Plant>;
  removePlant: (id: string) => Promise<void>;
  waterPlant: (id: string) => Promise<void>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  getPlantById: (id: string) => Plant | undefined;
  getPlantsNeedingWater: () => Plant[];
}

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  loading: false,
  initialized: false,

  loadPlants: async () => {
    set({ loading: true });
    const plants = await storage.getAllPlants();
    set({ plants, loading: false, initialized: true });
  },

  addPlant: async (input: CreatePlantInput) => {
    const plant = await storage.createPlant(input);
    set((state) => ({ plants: [plant, ...state.plants] }));
    return plant;
  },

  removePlant: async (id: string) => {
    await storage.deletePlant(id);
    set((state) => ({ plants: state.plants.filter((p) => p.id !== id) }));
  },

  waterPlant: async (id: string) => {
    const updated = await storage.waterPlant(id);
    if (updated) {
      set((state) => ({
        plants: state.plants.map((p) => (p.id === id ? updated : p)),
      }));
    }
  },

  updatePlant: async (id: string, updates: Partial<Plant>) => {
    await storage.updatePlant(id, updates);
    set((state) => ({
      plants: state.plants.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  getPlantById: (id: string) => {
    return get().plants.find((p) => p.id === id);
  },

  getPlantsNeedingWater: () => {
    const now = new Date().toISOString();
    return get().plants.filter((p) => p.nextWateringAt <= now);
  },
}));
