export interface PlantIssue {
  name: string;
  confidence: number; // 0-1
  description: string;
  treatment: string;
}

export interface DiagnosisResult {
  plantId: string;
  photoUri: string;
  timestamp: string;
  overallHealth: 'healthy' | 'mild_issues' | 'needs_attention' | 'critical';
  issues: PlantIssue[];
  careRecommendations: string[];
}

export interface IdentificationResult {
  species: string;
  scientificName: string;
  wateringIntervalDays: number;
  wateringInstructions: string;
  lightPreference: 'low' | 'medium' | 'bright_indirect' | 'direct';
  description: string;
  careNotes: string;
  initialHealth: 'healthy' | 'mild_issues' | 'needs_attention' | 'critical';
  initialIssues: PlantIssue[];
  initialHealthSummary: string;
}
