export interface Plant {
  id: string;
  name: string;
  species: string;
  scientificName?: string;
  photoUri: string;
  wateringIntervalDays: number;
  wateringInstructions?: string | null;
  lastWateredAt: string | null; // ISO 8601; null = never watered (just added)
  nextWateringAt: string; // ISO 8601
  lightPreference?: 'low' | 'medium' | 'bright_indirect' | 'direct';
  notes?: string;
  roomId?: string | null;
  initialHealthSummary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantInput {
  name: string;
  species: string;
  scientificName?: string;
  photoUri: string;
  wateringIntervalDays: number;
  wateringInstructions?: string | null;
  lightPreference?: Plant['lightPreference'];
  notes?: string;
  roomId?: string | null;
  initialHealthSummary?: string | null;
}
