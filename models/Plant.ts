export interface Plant {
  id: string;
  name: string;
  species: string;
  scientificName?: string;
  photoUri: string;
  wateringIntervalDays: number;
  lastWateredAt: string; // ISO 8601
  nextWateringAt: string; // ISO 8601
  lightPreference?: 'low' | 'medium' | 'bright_indirect' | 'direct';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantInput {
  name: string;
  species: string;
  scientificName?: string;
  photoUri: string;
  wateringIntervalDays: number;
  lightPreference?: Plant['lightPreference'];
  notes?: string;
}
