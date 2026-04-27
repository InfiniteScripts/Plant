import { useEffect } from 'react';
import { useRoomStore } from '@/stores/roomStore';

export function useRooms() {
  const store = useRoomStore();

  useEffect(() => {
    if (!store.initialized) {
      store.loadRooms();
    }
  }, [store.initialized]);

  return store;
}
