import * as SQLite from 'expo-sqlite';
import { Plant, CreatePlantInput } from '@/models/Plant';
import { Room, CreateRoomInput, DEFAULT_ROOM_EMOJI } from '@/models/Room';
import { WateringEvent } from '@/models/WateringSchedule';
import { addDays, formatISO } from 'date-fns';

type SqlValue = string | number | null;

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
      lastWateredAt TEXT,
      nextWateringAt TEXT NOT NULL,
      lightPreference TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '${DEFAULT_ROOM_EMOJI}',
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

  // Migration: add roomId to plants if missing.
  // Catch the duplicate-column error rather than pre-checking, since
  // PRAGMA table_info results aren't always reliable across hot reloads.
  try {
    await database.execAsync(
      `ALTER TABLE plants ADD COLUMN roomId TEXT REFERENCES rooms(id) ON DELETE SET NULL;`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('duplicate column name')) {
      throw err;
    }
  }

  // Migration: add wateringInstructions and initialHealthSummary if missing.
  for (const col of ['wateringInstructions', 'initialHealthSummary']) {
    try {
      await database.execAsync(`ALTER TABLE plants ADD COLUMN ${col} TEXT;`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('duplicate column name')) {
        throw err;
      }
    }
  }

  // Migration: drop NOT NULL from plants.lastWateredAt so newly added
  // plants can record "never watered". SQLite requires a table rebuild
  // to alter a column constraint.
  const plantCols = await database.getAllAsync<{ name: string; notnull: number }>(
    `PRAGMA table_info(plants);`
  );
  const lastWatered = plantCols.find((c) => c.name === 'lastWateredAt');
  if (lastWatered?.notnull === 1) {
    await database.execAsync(`
      BEGIN TRANSACTION;
      CREATE TABLE plants_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        species TEXT NOT NULL,
        scientificName TEXT,
        photoUri TEXT NOT NULL,
        wateringIntervalDays INTEGER NOT NULL DEFAULT 7,
        wateringInstructions TEXT,
        lastWateredAt TEXT,
        nextWateringAt TEXT NOT NULL,
        lightPreference TEXT,
        notes TEXT,
        roomId TEXT REFERENCES rooms(id) ON DELETE SET NULL,
        initialHealthSummary TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      INSERT INTO plants_new SELECT id, name, species, scientificName, photoUri, wateringIntervalDays, wateringInstructions, lastWateredAt, nextWateringAt, lightPreference, notes, roomId, initialHealthSummary, createdAt, updatedAt FROM plants;
      DROP TABLE plants;
      ALTER TABLE plants_new RENAME TO plants;
      COMMIT;
    `);
  }
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
  const plant: Plant = {
    id: generateId(),
    ...input,
    lastWateredAt: null,
    nextWateringAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await database.runAsync(
    `INSERT INTO plants (id, name, species, scientificName, photoUri, wateringIntervalDays, wateringInstructions, lastWateredAt, nextWateringAt, lightPreference, notes, roomId, initialHealthSummary, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      plant.id, plant.name, plant.species, plant.scientificName ?? null,
      plant.photoUri, plant.wateringIntervalDays,
      plant.wateringInstructions ?? null, plant.lastWateredAt,
      plant.nextWateringAt, plant.lightPreference ?? null, plant.notes ?? null,
      plant.roomId ?? null, plant.initialHealthSummary ?? null,
      plant.createdAt, plant.updatedAt,
    ]
  );

  return plant;
}

export async function updatePlant(id: string, updates: Partial<Plant>): Promise<void> {
  const database = await getDatabase();
  const now = formatISO(new Date());
  const fields: string[] = [];
  const values: SqlValue[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'id' && key !== 'createdAt') {
      fields.push(`${key} = ?`);
      values.push(value as SqlValue);
    }
  }

  fields.push('updatedAt = ?');
  values.push(now, id);

  await database.runAsync(
    `UPDATE plants SET ${fields.join(', ')} WHERE id = ?`,
    values
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

// Rooms

export async function getAllRooms(): Promise<Room[]> {
  const database = await getDatabase();
  return database.getAllAsync<Room>('SELECT * FROM rooms ORDER BY createdAt ASC');
}

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const database = await getDatabase();
  const now = formatISO(new Date());
  const room: Room = {
    id: generateId(),
    name: input.name,
    emoji: input.emoji ?? DEFAULT_ROOM_EMOJI,
    createdAt: now,
    updatedAt: now,
  };
  await database.runAsync(
    `INSERT INTO rooms (id, name, emoji, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
    [room.id, room.name, room.emoji, room.createdAt, room.updatedAt]
  );
  return room;
}

export async function updateRoom(id: string, updates: Partial<Room>): Promise<void> {
  const database = await getDatabase();
  const now = formatISO(new Date());
  const fields: string[] = [];
  const values: SqlValue[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'id' && key !== 'createdAt') {
      fields.push(`${key} = ?`);
      values.push(value as SqlValue);
    }
  }
  fields.push('updatedAt = ?');
  values.push(now, id);
  await database.runAsync(`UPDATE rooms SET ${fields.join(', ')} WHERE id = ?`, values);
}

// Note: ON DELETE SET NULL on plants.roomId means deleting a room
// keeps the plants but unassigns them.
export async function deleteRoom(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM rooms WHERE id = ?', [id]);
}
