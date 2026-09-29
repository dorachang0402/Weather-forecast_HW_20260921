import { NextRequest, NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { syncCwaWeatherToSqlite } from '@/lib/syncWeather';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    initDatabase();

    // 1. 取得 SQLite 中所有可用的預報時段
    let allSlots = db
      .prepare('SELECT DISTINCT start_time, end_time FROM weather_forecasts ORDER BY start_time ASC')
      .all() as Array<{ start_time: string; end_time: string }>;

    // 若資料庫為空（例如在 Vercel 首次啟動或 /tmp/weather.db 剛建立），自動從 CWA API 抓取並寫入 SQLite
    if (!allSlots || allSlots.length === 0) {
      await syncCwaWeatherToSqlite();
      allSlots = db
        .prepare('SELECT DISTINCT start_time, end_time FROM weather_forecasts ORDER BY start_time ASC')
        .all() as Array<{ start_time: string; end_time: string }>;
    }

    if (!allSlots || allSlots.length === 0) {
      return NextResponse.json(
        { success: false, message: '無法取得氣象資料，請確認 CWA_API_KEY 是否正確。' },
        { status: 500 }
      );
    }

    // 2. 檢查網址參數是否有指定特定 startTime，若無則預設為第 1 個時段
    const { searchParams } = new URL(request.url);
    const requestedStartTime = searchParams.get('startTime');

    const selectedSlot = requestedStartTime
      ? allSlots.find((s) => s.start_time === requestedStartTime) || allSlots[0]
      : allSlots[0];

    // 3. 取得該時段下全台 22 縣市的天氣預報資料
    const forecasts = db
      .prepare('SELECT * FROM weather_forecasts WHERE start_time = ? ORDER BY id ASC')
      .all(selectedSlot.start_time);

    return NextResponse.json({
      success: true,
      selectedTimeSlot: {
        startTime: selectedSlot.start_time,
        endTime: selectedSlot.end_time,
      },
      allTimeSlots: allSlots.map((s) => ({
        startTime: s.start_time,
        endTime: s.end_time,
      })),
      count: forecasts.length,
      data: forecasts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
