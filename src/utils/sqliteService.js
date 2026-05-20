import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'flowstate_db';
const READONLY = false;

let sqliteConn = null;
let dbInstance = null;
let initPromise = null;

// Initialize native SQLite connection and tables
export const initSQLite = async () => {
  if (!Capacitor.isNativePlatform()) {
    return true; // Web fallback
  }

  // Prevent multiple parallel initializations
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      if (!sqliteConn) {
        sqliteConn = new SQLiteConnection(CapacitorSQLite);
      }

      // Check if connection already exists to avoid throwing errors on HMR/reload
      const isConn = (await sqliteConn.isConnection(DB_NAME, READONLY)).result;
      if (isConn) {
        dbInstance = await sqliteConn.retrieveConnection(DB_NAME, READONLY);
      } else {
        dbInstance = await sqliteConn.createConnection(DB_NAME, false, 'no-encryption', 1, READONLY);
      }

      await dbInstance.open();

      // Create a key-value store table in SQLite to hold our structured stats and paths config.
      // This key-value schema is extremely fast, avoids column schema rigidity,
      // and behaves identical to localStorage while being 100% permanently persisted in native SQLite.
      const schema = `
        CREATE TABLE IF NOT EXISTS key_value_store (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `;
      await dbInstance.execute(schema);
      return true;
    } catch (error) {
      console.error('Failed to initialize native SQLite database:', error);
      dbInstance = null;
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
};

// Retrieve a value by key
export const getSQLiteValue = async (key) => {
  if (!Capacitor.isNativePlatform()) {
    return localStorage.getItem(key);
  }

  try {
    const isReady = await initSQLite();
    if (!isReady || !dbInstance) {
      return localStorage.getItem(key); // Graceful fallback
    }

    const res = await dbInstance.query('SELECT value FROM key_value_store WHERE key = ?;', [key]);
    if (res && res.values && res.values.length > 0) {
      return res.values[0].value;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch key "${key}" from SQLite:`, error);
    return localStorage.getItem(key); // Graceful fallback
  }
};

// Save a key-value pair
export const setSQLiteValue = async (key, value) => {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(key, value);
    return;
  }

  try {
    const isReady = await initSQLite();
    if (!isReady || !dbInstance) {
      localStorage.setItem(key, value); // Graceful fallback
      return;
    }

    await dbInstance.run(
      'INSERT OR REPLACE INTO key_value_store (key, value) VALUES (?, ?);',
      [key, value]
    );
  } catch (error) {
    console.error(`Failed to write key "${key}" to SQLite:`, error);
    localStorage.setItem(key, value); // Graceful fallback
  }
};
