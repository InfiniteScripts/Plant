export interface Room {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomInput {
  name: string;
  emoji?: string;
}

export const DEFAULT_ROOM_EMOJI = '🪴';
