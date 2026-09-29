'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { WeatherMapItem } from '@/components/WeatherMap';

// 動態載入 Leaflet 地圖元件，避免 SSR 問題
const WeatherMap = dynamic(() => import('@/components/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '8px' }}>
      <p style={{ color: '#64748b' }}>地圖載入中...</p>
    </div>
  ),
});

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface WeatherApiResponse {
  success: boolean;
  selectedTimeSlot?: TimeSlot;
  allTimeSlots?: TimeSlot[];
  count?: number;
  data?: WeatherMapItem[];
  error?: string;
  message?: string;
}

/**
 * 簡易時間格式化函式：將 "2026-09-29 06:00:00" 轉為 "09/29 06:00"
 */
function formatTimeShort(timeStr: string) {
  if (!timeStr) return '';
  const parts = timeStr.split(' ');
  if (parts.length < 2) return timeStr;
  const dateParts = parts[0].split('-');
  const monthDay = dateParts.length >= 3 ? `${dateParts[1]}/${dateParts[2]}` : parts[0];
  const time = parts[1].substring(0, 5);
  return `${monthDay} ${time}`;
}

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherMapItem[]>([]);
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 依據指定的 startTime 載入該時段的天氣資料
  async function loadWeather(targetStartTime?: string) {
    try {
      setLoading(true);
      setError(null);
      const url = targetStartTime
        ? `/api/weather?startTime=${encodeURIComponent(targetStartTime)}`
        : '/api/weather';

      const res = await fetch(url);
      const json: WeatherApiResponse = await res.json();

      if (json.success && json.data) {
        setWeatherData(json.data);
        if (json.selectedTimeSlot) {
          setSelectedSlot(json.selectedTimeSlot);
        }
        if (json.allTimeSlots) {
          setAllTimeSlots(json.allTimeSlots);
        }
      } else {
        setError(json.error || json.message || '無法取得氣象資料');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '連線錯誤');
    } finally {
      setLoading(false);
    }
  }

  // 初始載入（預設載入第 1 個時段）
  useEffect(() => {
    loadWeather();
  }, []);

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#0f172a' }}>
          Taiwan Weather GIS Dashboard
        </h1>
        <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '14px' }}>
          Milestone 3-2 — 36 小時預報時段切換 (3 個時段)
        </p>

        {/* 時段切換按鈕區塊 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
            ⏱️ 選擇預報時段：
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allTimeSlots.map((slot, index) => {
              const isSelected = selectedSlot?.startTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  onClick={() => loadWeather(slot.startTime)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: isSelected ? '#0284c7' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  時段 {index + 1}：{formatTimeShort(slot.startTime)} ~ {formatTimeShort(slot.endTime)}
                </button>
              );
            })}
          </div>
        </div>

        {selectedSlot && (
          <div style={{ padding: '6px 12px', background: '#f0f9ff', color: '#0369a1', borderRadius: '6px', fontSize: '13px', display: 'inline-block' }}>
            📌 當前顯示時段：<strong>{selectedSlot.startTime} ~ {selectedSlot.endTime}</strong> (共 {weatherData.length} 個縣市)
          </div>
        )}
      </header>

      {loading && <p style={{ color: '#64748b' }}>載入氣象資料中...</p>}

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '16px' }}>
          ❌ 載入失敗：{error}
        </div>
      )}

      {!error && (
        <section>
          <WeatherMap weatherData={weatherData} />
          <p style={{ marginTop: '10px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
            💡 點擊地圖上的標記 (Marker) 查看該縣市天氣、氣溫與降雨機率
          </p>
        </section>
      )}

      <footer style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
        Alo DIC-2 Taiwan Weather GIS Dashboard • Milestone 3-2
      </footer>
    </main>
  );
}
