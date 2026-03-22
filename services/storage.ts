import * as SQLite from 'expo-sqlite';
import { Plant, CreatePlantInput } from '@/models/Plant';
import { WateringEvent } from '@/models/WateringSchedule';
import { addDays, formatISO } from 'date-fns';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('plant.db');
  await initDatabase(db);
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS plants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      scientificName TEXT,
      photoUri TEXT NOT NULL,
      wateringIntervalDays INTEGER NOT NULL DEFAULT 7,
      lastWateredAt TEXT NOT NULL,
      nextWateringAt TEXT NOT NULL,
      lightPreference TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watering_events (
      id TEXT PRIMARY KEY,
      plantId TEXT NOT NULL,
      scheduledAt TEXT NOT NULL,
      completedAt TEXT,
      skipped INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diagnosis_results (
      id TEXT PRIMARY KEY,
      plantId TEXT NOT NULL,
      photoUri TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      overallHealth TEXT NOT NULL,
      issues TEXT NOT NULL,
      careRecommendations TEXT NOT NULL,
      FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE CASCADE
    );
  `);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Plant CRUD

export async function getAllPlants(): Promise<Plant[]> {
  const database = await getDatabase();
  return database.getAllAsync<Plant>('SELECT * FROM plants ORDER BY createdAt DESC');
}

export async function getPlantById(id: string): Promise<Plant | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Plant>('SELECT * FROM plants WHERE id = ?', [id]);
}

export async function createPlant(input: CreatePlantInput): Promise<Plant> {
  const database = await getDatabase();
  const now = formatISO(new Date());
  const nextWatering = formatISO(addDays(new Date(), input.wateringIntervalDays));
  const plant: Plant = {
    id: generateId(),
    ...input,
    lastWateredAt: now,
    nextWateringAt: nextWatering,
    createdAt: now,
    updatedAt: now,
  };

  await database.runAsync(
    `INSERT INTO plants (id, name, species, scientificName, photoUri, wateringIntervalDays, lastWateredAt, nextWateringAt, lightPreference, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      plant.id, plant.name, plant.species, plant.scientificName ?? null,
      plant.photoUri, plant.wateringIntervalDays, plant.lastWateredAt,
      plant.nextWateringAt, plant.lightPreference ?? null, plant.notes ?? null,
      plant.createdAt, plant.updatedAt,
    ]
  );

  return plant;
}

export async function updatePlant(id: string, updates: Partial<Plant>): Promise<void> {
  const database = await getDatabase();
  const now = formatISO(new Date());
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'id' && key !== 'createdAt') {
      fields.push(`${key} = ?`);
      values.push(value as string | number | null);
    }
  }

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  await database.runAsync(
    `UPDATE plants SET ${fields.join(', ')} WHERE id = ?`,
    values as (string | number | null)[]
  );
}

export async function deletePlant(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM plants WHERE id = ?', [id]);
}

export async function waterPlant(id: string): Promise<Plant | null> {
  const plant = await getPlantById(id);
  if (!plant) return null;

  const now = new Date();
  const nextWatering = addDays(now, plant.wateringIntervalDays);

  await updatePlant(id, {
    lastWateredAt: formatISO(now),
    nextWateringAt: formatISO(nextWatering),
  });

  // Record watering event
  await createWateringEvent({
    plantId: id,
    scheduledAt: plant.nextWateringAt,
    completedAt: formatISO(now),
    skipped: false,
  });

  return getPlantById(id);
}

// Watering Events

interface CreateWateringEventInput {
  plantId: string;
  scheduledAt: string;
  completedAt?: string;
  skipped: boolean;
}

export async function createWateringEvent(input: CreateWateringEventInput): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO watering_events (id, plantId, scheduledAt, completedAt, skipped)
     VALUES (?, ?, ?, ?, ?)`,
    [generateId(), input.plantId, input.scheduledAt, input.completedAt ?? null, input.skipped ? 1 : 0]
  );
}

interface WateringEventRow {
  id: string;
  plantId: string;
  scheduledAt: string;
  completedAt?: string;
  skipped: number;
}

export async function getWateringEvents(plantId: string): Promise<WateringEvent[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<WateringEventRow>(
    'SELECT * FROM watering_events WHERE plantId = ? ORDER BY scheduledAt DESC',
    [plantId]
  );
  return rows.map(r => ({
    id: r.id,
    plantId: r.plantId,
    scheduledAt: r.scheduledAt,
    completedAt: r.completedAt,
    skipped: Boolean(r.skipped),
  }));
}

export async function getPlantsNeedingWater(): Promise<Plant[]> {
  const database = await getDatabase();
  const now = formatISO(new Date());
  return database.getAllAsync<Plant>(
    'SELECT * FROM plants WHERE nextWateringAt <= ? ORDER BY nextWateringAt ASC',
    [now]
  );
}
