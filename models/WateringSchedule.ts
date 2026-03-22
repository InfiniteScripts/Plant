export interface WateringEvent {
  id: string;
  plantId: string;
  scheduledAt: string; // ISO 8601
  completedAt?: string; // null if not yet done
  skipped: boolean;
}
