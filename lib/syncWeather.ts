import db, { initDatabase } from './db';
import { fetchCwaForecast } from './cwa';
import { getCountyCoordinate } from './taiwanCounties';
import { CwaApiResponse, CwaLocation } from '@/types/cwa';

export interface WeatherRecord {
  location_name: string;
  latitude: number;
  longitude: number;
  start_time: string;
  end_time: string;
  weather_description: string;
  weather_code: string | null;
  min_temperature: number | null;
  max_temperature: number | null;
  rain_probability: number | null;
  comfort_index: string | null;
}

/**
 * 解析 CWA JSON 為扁平化氣象紀錄陣列
 */
export function parseCwaData(cwaData: CwaApiResponse): WeatherRecord[] {
  const records: WeatherRecord[] = [];

  for (const loc of cwaData.records.location) {
    const locationName = loc.locationName;
    const coord = getCountyCoordinate(locationName);

    // 取得五大天氣要素
    const wxElement = loc.weatherElement.find((el) => el.elementName === 'Wx');
    const popElement = loc.weatherElement.find((el) => el.elementName === 'PoP');
    const minTElement = loc.weatherElement.find((el) => el.elementName === 'MinT');
    const maxTElement = loc.weatherElement.find((el) => el.elementName === 'MaxT');
    const ciElement = loc.weatherElement.find((el) => el.elementName === 'CI');

    // 每個縣市有 3 個預報時段 (12 小時一個時段，共 36 小時)
    const timeSlotsCount = wxElement?.time.length || 0;

    for (let i = 0; i < timeSlotsCount; i++) {
      const wxTime = wxElement?.time[i];
      const popTime = popElement?.time[i];
      const minTTime = minTElement?.time[i];
      const maxTTime = maxTElement?.time[i];
      const ciTime = ciElement?.time[i];

      if (!wxTime) continue;

      const minT = minTTime?.parameter.parameterName ? parseFloat(minTTime.parameter.parameterName) : null;
      const maxT = maxTTime?.parameter.parameterName ? parseFloat(maxTTime.parameter.parameterName) : null;
      const pop = popTime?.parameter.parameterName ? parseInt(popTime.parameter.parameterName, 10) : null;

      records.push({
        location_name: locationName,
        latitude: coord.latitude,
        longitude: coord.longitude,
        start_time: wxTime.startTime,
        end_time: wxTime.endTime,
        weather_description: wxTime.parameter.parameterName,
        weather_code: wxTime.parameter.parameterValue || null,
        min_temperature: isNaN(Number(minT)) ? null : minT,
        max_temperature: isNaN(Number(maxT)) ? null : maxT,
        rain_probability: isNaN(Number(pop)) ? null : pop,
        comfort_index: ciTime?.parameter.parameterName || null,
      });
    }
  }

  return records;
}

/**
 * 將解析後的氣象紀錄寫入 SQLite 資料庫 (使用 Upsert 避免重複)
 */
export function saveWeatherRecords(records: WeatherRecord[]) {
  initDatabase();

  const insertSql = `
    INSERT INTO weather_forecasts (
      location_name,
      latitude,
      longitude,
      start_time,
      end_time,
      weather_description,
      weather_code,
      min_temperature,
      max_temperature,
      rain_probability,
      comfort_index,
      updated_at
    ) VALUES (
      @location_name,
      @latitude,
      @longitude,
      @start_time,
      @end_time,
      @weather_description,
      @weather_code,
      @min_temperature,
      @max_temperature,
      @rain_probability,
      @comfort_index,
      datetime('now', 'localtime')
    )
    ON CONFLICT (location_name, start_time, end_time) DO UPDATE SET
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      weather_description = excluded.weather_description,
      weather_code = excluded.weather_code,
      min_temperature = excluded.min_temperature,
      max_temperature = excluded.max_temperature,
      rain_probability = excluded.rain_probability,
      comfort_index = excluded.comfort_index,
      updated_at = datetime('now', 'localtime');
  `;

  const insertStmt = db.prepare(insertSql);

  // 使用交易 (Transaction) 批次寫入以提升速度與一致性
  const insertMany = db.transaction((rows: WeatherRecord[]) => {
    let count = 0;
    for (const row of rows) {
      insertStmt.run(row);
      count++;
    }
    return count;
  });

  return insertMany(records);
}

/**
 * 完整同步流程：從 CWA API 抓取 -> 解析 -> 存入 SQLite
 */
export async function syncCwaWeatherToSqlite() {
  const cwaData = await fetchCwaForecast();
  const parsedRecords = parseCwaData(cwaData);
  const savedCount = saveWeatherRecords(parsedRecords);

  const uniqueLocations = new Set(parsedRecords.map((r) => r.location_name));

  return {
    success: true,
    locationCount: uniqueLocations.size,
    recordCount: savedCount,
  };
}
