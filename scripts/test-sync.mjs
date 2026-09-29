import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// 讀取 .env.local 中的 CWA_API_KEY
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...values] = trimmed.split('=');
        process.env[key.trim()] = values.join('=').trim();
      }
    }
  }
}

loadEnv();

const CWA_API_KEY = process.env.CWA_API_KEY;
if (!CWA_API_KEY) {
  console.error('Error: CWA_API_KEY not found in .env.local');
  process.exit(1);
}

// 台灣 22 縣市中心點經緯度
const TAIWAN_COUNTIES = {
  '基隆市': { latitude: 25.1276, longitude: 121.7392 },
  '臺北市': { latitude: 25.0330, longitude: 121.5654 },
  '台北市': { latitude: 25.0330, longitude: 121.5654 },
  '新北市': { latitude: 25.0169, longitude: 121.4628 },
  '桃園市': { latitude: 24.9936, longitude: 121.3010 },
  '新竹市': { latitude: 24.8138, longitude: 120.9675 },
  '新竹縣': { latitude: 24.8387, longitude: 121.0177 },
  '苗栗縣': { latitude: 24.5602, longitude: 120.8214 },
  '臺中市': { latitude: 24.1477, longitude: 120.6736 },
  '台中市': { latitude: 24.1477, longitude: 120.6736 },
  '彰化縣': { latitude: 24.0518, longitude: 120.5161 },
  '南投縣': { latitude: 23.9609, longitude: 120.9719 },
  '雲林縣': { latitude: 23.7092, longitude: 120.4313 },
  '嘉義市': { latitude: 23.4800, longitude: 120.4491 },
  '嘉義縣': { latitude: 23.4518, longitude: 120.2555 },
  '臺南市': { latitude: 22.9997, longitude: 120.2270 },
  '台南市': { latitude: 22.9997, longitude: 120.2270 },
  '高雄市': { latitude: 22.6273, longitude: 120.3014 },
  '屏東縣': { latitude: 22.6713, longitude: 120.4880 },
  '宜蘭縣': { latitude: 24.7021, longitude: 121.7377 },
  '花蓮縣': { latitude: 23.9871, longitude: 121.6016 },
  '臺東縣': { latitude: 22.7583, longitude: 121.1444 },
  '台東縣': { latitude: 22.7583, longitude: 121.1444 },
  '澎湖縣': { latitude: 23.5712, longitude: 119.5793 },
  '金門縣': { latitude: 24.4493, longitude: 118.3766 },
  '連江縣': { latitude: 26.1505, longitude: 119.9499 },
};

async function run() {
  console.log('1. Fetching CWA forecast data...');
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${CWA_API_KEY}&format=JSON`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CWA API request failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  const locations = data.records?.location || [];
  console.log(`- Retrieved ${locations.length} locations from CWA API.`);

  console.log('2. Parsing CWA JSON records...');
  const records = [];
  for (const loc of locations) {
    const locName = loc.locationName;
    const coord = TAIWAN_COUNTIES[locName] || { latitude: 23.9756, longitude: 120.9738 };

    const wxElement = loc.weatherElement.find((el) => el.elementName === 'Wx');
    const popElement = loc.weatherElement.find((el) => el.elementName === 'PoP');
    const minTElement = loc.weatherElement.find((el) => el.elementName === 'MinT');
    const maxTElement = loc.weatherElement.find((el) => el.elementName === 'MaxT');
    const ciElement = loc.weatherElement.find((el) => el.elementName === 'CI');

    const timeSlotsCount = wxElement?.time.length || 0;
    for (let i = 0; i < timeSlotsCount; i++) {
      const wxTime = wxElement?.time[i];
      const popTime = popElement?.time[i];
      const minTTime = minTElement?.time[i];
      const maxTTime = maxTElement?.time[i];
      const ciTime = ciElement?.time[i];

      if (!wxTime) continue;

      const minT = minTTime?.parameter?.parameterName ? parseFloat(minTTime.parameter.parameterName) : null;
      const maxT = maxTTime?.parameter?.parameterName ? parseFloat(maxTTime.parameter.parameterName) : null;
      const pop = popTime?.parameter?.parameterName ? parseInt(popTime.parameter.parameterName, 10) : null;

      records.push({
        location_name: locName,
        latitude: coord.latitude,
        longitude: coord.longitude,
        start_time: wxTime.startTime,
        end_time: wxTime.endTime,
        weather_description: wxTime.parameter.parameterName,
        weather_code: wxTime.parameter.parameterValue || null,
        min_temperature: isNaN(minT) ? null : minT,
        max_temperature: isNaN(maxT) ? null : maxT,
        rain_probability: isNaN(pop) ? null : pop,
        comfort_index: ciTime?.parameter?.parameterName || null,
      });
    }
  }
  console.log(`- Total parsed records: ${records.length}`);

  console.log('3. Writing records into weather.db (SQLite)...');
  const db = new Database(path.join(process.cwd(), 'weather.db'));
  db.pragma('journal_mode = WAL');

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

  const stmt = db.prepare(insertSql);
  const tx = db.transaction((rows) => {
    let c = 0;
    for (const r of rows) {
      stmt.run(r);
      c++;
    }
    return c;
  });

  const insertedCount = tx(records);
  console.log(`- Inserted / updated ${insertedCount} records in weather.db.`);

  console.log('4. Querying SQLite database for verification...');
  const countRow = db.prepare('SELECT COUNT(*) as total_records, COUNT(DISTINCT location_name) as total_locations FROM weather_forecasts').get();
  console.log(`- Database Total Records: ${countRow.total_records}`);
  console.log(`- Database Total Counties: ${countRow.total_locations}`);

  const sampleRows = db.prepare('SELECT location_name, latitude, longitude, start_time, end_time, weather_description, min_temperature, max_temperature, rain_probability FROM weather_forecasts LIMIT 3').all();
  console.log('- Sample Data in SQLite:');
  console.log(JSON.stringify(sampleRows, null, 2));

  db.close();
  console.log('SUCCESS: Milestone 2-3 completed successfully!');
}

run().catch((err) => {
  console.error('Error during test sync:', err);
  process.exit(1);
});
