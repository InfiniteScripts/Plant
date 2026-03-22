import { useEffect } from 'react';
import { usePlantStore } from '@/stores/plantStore';

export function usePlants() {
  const store = usePlantStore();

  useEffect(() => {
    if (!store.initialized) {
      store.loadPlants();
    }
  }, [store.initialized]);

  return store;
}
