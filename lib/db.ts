import Database from 'better-sqlite3';
import path from 'path';

/**
 * 取得 SQLite 資料庫檔案路徑
 * - Vercel Serverless 環境：使用唯一可讀寫的 /tmp/weather.db
 * - 本機開發環境：使用專案根目錄下的 weather.db
 */
export function getDatabasePath(): string {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'weather.db');
  }
  return path.join(process.cwd(), 'weather.db');
}

let dbInstance: Database.Database | null = null;

/**
 * 取得或建立 SQLite 資料庫連線實例 (Singleton)
 */
export function getDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = getDatabasePath();
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
  }
  return dbInstance;
}

/**
 * 初始化資料庫表格：建立 weather_forecasts table 及索引
 */
export function initDatabase() {
  const db = getDb();

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS weather_forecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      weather_description TEXT NOT NULL,
      weather_code TEXT,
      min_temperature REAL,
      max_temperature REAL,
      rain_probability INTEGER,
      comfort_index TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      CONSTRAINT uq_location_time_slot UNIQUE (location_name, start_time, end_time)
    );

    CREATE INDEX IF NOT EXISTS idx_weather_forecasts_time 
      ON weather_forecasts (start_time, end_time);

    CREATE INDEX IF NOT EXISTS idx_weather_forecasts_location 
      ON weather_forecasts (location_name);
  `;

  db.exec(createTableSql);
  return db;
}

// 預設匯出 db getter 實例供後續操作使用
const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export default db;
