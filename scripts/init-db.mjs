import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'weather.db');
const db = new Database(DB_PATH);

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

const tableInfo = db.pragma('table_info(weather_forecasts)');
console.log('TABLE_COLUMNS:', JSON.stringify(tableInfo, null, 2));

const indices = db.pragma('index_list(weather_forecasts)');
console.log('INDICES:', JSON.stringify(indices, null, 2));

console.log('SUCCESS: weather.db and weather_forecasts table created successfully!');
db.close();
