import Database from 'better-sqlite3';
import path from 'path';

// SQLite 資料庫檔案路徑（存放在專案根目錄 weather.db）
const DB_PATH = path.join(process.cwd(), 'weather.db');

// 建立或開啟 SQLite 資料庫連線
const db = new Database(DB_PATH);

// 啟用 WAL 模式以提升效能與並行讀寫能力
db.pragma('journal_mode = WAL');

/**
 * 初始化資料庫表格：建立 weather_forecasts table 及索引
 */
export function initDatabase() {
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

// 預設匯出 db 實例供後續操作使用
export default db;
