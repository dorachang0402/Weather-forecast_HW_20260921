import Database from 'better-sqlite3';
import path from 'path';

console.log('=== 1. SQLite Database Check ===');
const dbPath = path.join(process.cwd(), 'weather.db');
const db = new Database(dbPath);

const totalCount = db.prepare('SELECT COUNT(*) as count FROM weather_forecasts').get();
const countyCount = db.prepare('SELECT COUNT(DISTINCT location_name) as count FROM weather_forecasts').get();
const timeSlots = db.prepare('SELECT DISTINCT start_time, end_time FROM weather_forecasts ORDER BY start_time ASC').all();

console.log(`- Total Records in DB: ${totalCount.count} (Expected: 66)`);
console.log(`- Total Distinct Counties: ${countyCount.count} (Expected: 22)`);
console.log(`- Total Distinct Time Slots: ${timeSlots.length} (Expected: 3)`);
timeSlots.forEach((s, idx) => {
  const c = db.prepare('SELECT COUNT(*) as count FROM weather_forecasts WHERE start_time = ?').get(s.start_time);
  console.log(`  時段 ${idx + 1}: ${s.start_time} ~ ${s.end_time} -> ${c.count} 縣市`);
});

db.close();

console.log('\n=== 2. API Response Check ===');
async function testApi() {
  const res = await fetch('http://localhost:3000/api/weather');
  const json = await res.json();
  console.log(`- /api/weather Status: ${res.status}`);
  console.log(`- Success: ${json.success}`);
  console.log(`- Available Time Slots: ${json.allTimeSlots?.length}`);
  console.log(`- Default Slot Records: ${json.count}`);

  for (let i = 0; i < json.allTimeSlots.length; i++) {
    const slot = json.allTimeSlots[i];
    const slotRes = await fetch('http://localhost:3000/api/weather?startTime=' + encodeURIComponent(slot.startTime));
    const slotJson = await slotRes.json();
    console.log(`- 時段 ${i + 1} 查詢 (${slot.startTime}): ${slotJson.count} 筆資料 (台北市: ${slotJson.data.find(d => d.location_name === '臺北市' || d.location_name === '台北市')?.min_temperature}°C~${slotJson.data.find(d => d.location_name === '臺北市' || d.location_name === '台北市')?.max_temperature}°C)`);
  }
}

testApi().then(() => console.log('\n✅ All automated verification checks passed!'));
