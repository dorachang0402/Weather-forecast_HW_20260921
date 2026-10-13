'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { WeatherMapItem } from '@/components/WeatherMap';
import { getWeatherEmoji, getWeatherAdvice } from '@/lib/weatherUtils';

// 動態載入 Leaflet 地圖元件，避免 SSR 問題
const WeatherMap = dynamic(() => import('@/components/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e2e8f0',
      }}
    >
      <div className="loading-card">
        <div className="spinner" />
        <span>載入台灣氣象地圖中…</span>
      </div>
    </div>
  ),
});

interface WeatherApiResponse {
  success: boolean;
  selectedTimeSlot?: {
    startTime: string;
    endTime: string;
  };
  count?: number;
  data?: WeatherMapItem[];
  error?: string;
  message?: string;
}

/**
 * 格式化時間：將 "2026-10-13 22:00:00" 轉為 "2026/10/13 22:00"
 */
function formatCwaTime(timeStr?: string) {
  if (!timeStr) return '';
  const parts = timeStr.split(' ');
  const dateStr = parts[0].replace(/-/g, '/');
  const time = parts.length > 1 ? parts[1].substring(0, 5) : '';
  return `${dateStr} ${time}`;
}

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherMapItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WeatherMapItem | null>(null);
  const [updateTime, setUpdateTime] = useState<string>('');
  const [baseMap, setBaseMap] = useState<'topo' | 'osm'>('topo');
  const [activeLayer, setActiveLayer] = useState<'temp' | 'rain' | 'weather'>('temp');
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 載入中央氣象署即時預報資料
  async function loadWeather() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/weather');
      const json: WeatherApiResponse = await res.json();

      if (json.success && json.data && json.data.length > 0) {
        setWeatherData(json.data);
        if (json.selectedTimeSlot) {
          setUpdateTime(json.selectedTimeSlot.startTime);
        }
        // 預設選中台北市或第 1 筆縣市
        const defaultItem =
          json.data.find((item) => item.location_name === '臺北市' || item.location_name === '台北市') ||
          json.data[0];
        setSelectedItem(defaultItem);
      } else {
        setError(json.error || json.message || '無法取得氣象資料');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '連線錯誤');
    } finally {
      setLoading(false);
    }
  }

  // 下拉選單切換縣市並平移視角
  function handleCountyChange(countyName: string) {
    const target = weatherData.find((item) => item.location_name === countyName);
    if (target) {
      setSelectedItem(target);
      setFlyToCoords([target.latitude, target.longitude]);
    }
  }

  // 📌 定位我的位置功能
  function handleLocateMe() {
    if (!navigator.geolocation) {
      alert('您的瀏覽器不支援地理定位');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFlyToCoords([latitude, longitude]);

        // 找出距離使用者最近的台灣縣市
        if (weatherData.length > 0) {
          let closest = weatherData[0];
          let minDist = Infinity;
          for (const item of weatherData) {
            const dist = Math.hypot(item.latitude - latitude, item.longitude - longitude);
            if (dist < minDist) {
              minDist = dist;
              closest = item;
            }
          }
          setSelectedItem(closest);
        }
        setLocating(false);
      },
      (err) => {
        console.warn('定位失敗:', err);
        alert('無法取得定位，請確認已允許瀏覽器定位權限');
        setLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    loadWeather();
  }, []);

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 滿版底層 GIS 地圖 */}
      <div className="map-fullscreen">
        <WeatherMap
          weatherData={weatherData}
          baseMap={baseMap}
          activeLayer={activeLayer}
          selectedItem={selectedItem}
          onSelectItem={(item) => setSelectedItem(item)}
          flyToCoords={flyToCoords}
        />
      </div>

      {/* 頂部中央：氣象署標準日期時間標題 */}
      {updateTime && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 900,
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: '800',
              fontStyle: 'italic',
              color: '#344023',
              letterSpacing: '1px',
              textShadow:
                '-1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff, 0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            {formatCwaTime(updateTime)}
          </div>
        </div>
      )}

      {/* 🌿 左上角：Milestone 3 升級版即時氣象卡片（含縣市快速選單、三大核心指標、舒適度與生活建議） */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 900,
          padding: '16px 18px',
          minWidth: '290px',
          maxWidth: '350px',
        }}
      >
        {/* 縣市快速切換選單 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>📍</span>
            <select
              value={selectedItem?.location_name || ''}
              onChange={(e) => handleCountyChange(e.target.value)}
              style={{
                backgroundColor: 'rgba(254, 250, 224, 0.12)',
                color: 'var(--cornsilk)',
                border: '1px solid rgba(254, 250, 224, 0.3)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {weatherData.map((item) => (
                <option
                  key={item.location_name}
                  value={item.location_name}
                  style={{ backgroundColor: '#283618', color: '#fefae0' }}
                >
                  {item.location_name}
                </option>
              ))}
            </select>
          </div>

          {selectedItem?.comfort_index && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(96, 108, 56, 0.6)',
                color: 'var(--cornsilk)',
                border: '1px solid rgba(254, 250, 224, 0.2)',
              }}
            >
              {selectedItem.comfort_index}
            </span>
          )}
        </div>

        {/* 天氣現象描述 */}
        <div style={{ fontSize: '14px', color: 'var(--sunlit-clay)', fontWeight: '600', marginBottom: '12px' }}>
          {getWeatherEmoji(selectedItem?.weather_description)} {selectedItem?.weather_description || '氣象資料載入中'}
        </div>

        {/* 三大核心即時氣象指標：最高溫 / 最低溫 / 降雨機率 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            backgroundColor: 'rgba(254, 250, 224, 0.08)',
            padding: '10px 6px',
            borderRadius: '10px',
            border: '1px solid rgba(254, 250, 224, 0.15)',
            marginBottom: '10px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>🔥 最高溫</div>
            <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#f87171' }}>
              {selectedItem?.max_temperature !== null && selectedItem?.max_temperature !== undefined
                ? `${selectedItem.max_temperature}°`
                : '--'}
            </div>
          </div>

          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(254, 250, 224, 0.15)', borderRight: '1px solid rgba(254, 250, 224, 0.15)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>❄️ 最低溫</div>
            <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#60a5fa' }}>
              {selectedItem?.min_temperature !== null && selectedItem?.min_temperature !== undefined
                ? `${selectedItem.min_temperature}°`
                : '--'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>💧 降雨機率</div>
            <div style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--sunlit-clay)' }}>
              {selectedItem?.rain_probability !== null && selectedItem?.rain_probability !== undefined
                ? `${selectedItem.rain_probability}%`
                : '--'}
            </div>
          </div>
        </div>

        {/* 生活氣象叮嚀 */}
        {selectedItem && (
          <div
            style={{
              padding: '6px 8px',
              backgroundColor: 'rgba(254, 250, 224, 0.06)',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: '1.4',
            }}
          >
            {getWeatherAdvice(selectedItem.max_temperature, selectedItem.min_temperature, selectedItem.rain_probability)}
          </div>
        )}

        <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', opacity: 0.8 }}>
          💡 點選地圖任一縣市或上方選單即可切換
        </div>
      </div>

      {/* 🎛️ 右上角：浮動操作控制面板（圖層切換 / 底圖切換 / 定位按鈕） */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 900,
          padding: '14px 16px',
          width: '210px',
        }}
      >
        {/* 圖層選擇 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            氣象圖層
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <button
              onClick={() => setActiveLayer('temp')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: activeLayer === 'temp' ? '1px solid var(--sunlit-clay)' : '1px solid rgba(254, 250, 224, 0.1)',
                backgroundColor: activeLayer === 'temp' ? 'var(--olive-leaf)' : 'rgba(254, 250, 224, 0.06)',
                color: 'var(--cornsilk)',
                fontSize: '12px',
                fontWeight: activeLayer === 'temp' ? 'bold' : 'normal',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🌡️</span>
              <span>氣溫分布</span>
            </button>

            <button
              onClick={() => setActiveLayer('rain')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: activeLayer === 'rain' ? '1px solid var(--sunlit-clay)' : '1px solid rgba(254, 250, 224, 0.1)',
                backgroundColor: activeLayer === 'rain' ? 'var(--olive-leaf)' : 'rgba(254, 250, 224, 0.06)',
                color: 'var(--cornsilk)',
                fontSize: '12px',
                fontWeight: activeLayer === 'rain' ? 'bold' : 'normal',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🌧️</span>
              <span>降雨機率</span>
            </button>

            <button
              onClick={() => setActiveLayer('weather')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: activeLayer === 'weather' ? '1px solid var(--sunlit-clay)' : '1px solid rgba(254, 250, 224, 0.1)',
                backgroundColor: activeLayer === 'weather' ? 'var(--olive-leaf)' : 'rgba(254, 250, 224, 0.06)',
                color: 'var(--cornsilk)',
                fontSize: '12px',
                fontWeight: activeLayer === 'weather' ? 'bold' : 'normal',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span>⛅</span>
              <span>天氣現象</span>
            </button>
          </div>
        </div>

        {/* 底圖切換 */}
        <div style={{ marginBottom: '12px', borderTop: '1px solid rgba(254, 250, 224, 0.15)', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            底圖選擇
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <button
              onClick={() => setBaseMap('topo')}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: baseMap === 'topo' ? '1px solid var(--sunlit-clay)' : '1px solid rgba(254, 250, 224, 0.1)',
                backgroundColor: baseMap === 'topo' ? 'var(--olive-leaf)' : 'rgba(254, 250, 224, 0.06)',
                color: 'var(--cornsilk)',
                fontSize: '11px',
                fontWeight: baseMap === 'topo' ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              地形圖
            </button>
            <button
              onClick={() => setBaseMap('osm')}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: baseMap === 'osm' ? '1px solid var(--sunlit-clay)' : '1px solid rgba(254, 250, 224, 0.1)',
                backgroundColor: baseMap === 'osm' ? 'var(--olive-leaf)' : 'rgba(254, 250, 224, 0.06)',
                color: 'var(--cornsilk)',
                fontSize: '11px',
                fontWeight: baseMap === 'osm' ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              街道圖
            </button>
          </div>
        </div>

        {/* 📌 定位我的位置按鈕 */}
        <button
          onClick={handleLocateMe}
          disabled={locating}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--copperwood)',
            color: 'var(--cornsilk)',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: locating ? 'not-allowed' : 'pointer',
            opacity: locating ? 0.7 : 1,
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <span>📌</span>
          <span>{locating ? '定位中…' : '定位我的位置'}</span>
        </button>
      </div>

      {/* 📊 右下角：圖例（依據目前選中的圖層切換） */}
      {activeLayer === 'temp' && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '20px',
            zIndex: 900,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            userSelect: 'none',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: '800',
                color: '#374151',
                textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
              }}
            >
              溫度分布圖 (°C)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', gap: '5px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: '10px',
                fontWeight: '800',
                fontStyle: 'italic',
                color: '#1f2937',
                height: '240px',
                paddingRight: '2px',
                textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
              }}
            >
              <span>38</span>
              <span>35</span>
              <span>31</span>
              <span>27</span>
              <span>23</span>
              <span>19</span>
              <span>15</span>
              <span>11</span>
              <span>5</span>
              <span>-1</span>
            </div>

            <div
              style={{
                width: '18px',
                height: '240px',
                borderRadius: '3px',
                border: '1px solid rgba(0,0,0,0.3)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                background:
                  'linear-gradient(to bottom, #7b1fa2 0%, #c2185b 10%, #e53935 20%, #fb8c00 35%, #fdd835 48%, #8bc34a 60%, #1b5e20 72%, #80deea 85%, #01579b 100%)',
              }}
            />
          </div>
        </div>
      )}

      {activeLayer === 'rain' && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '20px',
            zIndex: 900,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            userSelect: 'none',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: '800',
                color: '#374151',
                textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
              }}
            >
              降雨機率 (%)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', gap: '5px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: '10px',
                fontWeight: '800',
                fontStyle: 'italic',
                color: '#1f2937',
                height: '200px',
                paddingRight: '2px',
                textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
              }}
            >
              <span>100%</span>
              <span>70%</span>
              <span>50%</span>
              <span>30%</span>
              <span>10%</span>
              <span>0%</span>
            </div>

            <div
              style={{
                width: '18px',
                height: '200px',
                borderRadius: '3px',
                border: '1px solid rgba(0,0,0,0.3)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                background: 'linear-gradient(to bottom, #1e40af 0%, #2563eb 30%, #0284c7 50%, #38bdf8 75%, #10b981 100%)',
              }}
            />
          </div>
        </div>
      )}

      {/* 浮動載入提示狀態 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="spinner" />
            <span>正在更新即時氣象資料…</span>
          </div>
        </div>
      )}

      {/* 錯誤提示卡片 */}
      {error && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            padding: '12px 20px',
            backgroundColor: 'rgba(188, 108, 37, 0.95)',
            borderColor: 'var(--sunlit-clay)',
            color: 'var(--cornsilk)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
          <button
            onClick={() => loadWeather()}
            style={{
              marginLeft: '8px',
              padding: '4px 8px',
              backgroundColor: 'var(--cornsilk)',
              color: 'var(--black-forest)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            重試
          </button>
        </div>
      )}
    </main>
  );
}
