'use client';

import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getWeatherEmoji, getWeatherAdvice } from '@/lib/weatherUtils';

export interface WeatherMapItem {
  id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  start_time: string;
  end_time: string;
  weather_description: string;
  weather_code?: string;
  min_temperature: number | null;
  max_temperature: number | null;
  rain_probability: number | null;
  comfort_index?: string;
}

interface WeatherMapProps {
  weatherData: WeatherMapItem[];
  baseMap?: 'topo' | 'osm';
  activeLayer?: 'temp' | 'rain' | 'weather';
  selectedItem?: WeatherMapItem | null;
  onSelectItem?: (item: WeatherMapItem) => void;
  flyToCoords?: [number, number] | null;
}

/**
 * 依據溫度回傳對應的氣象色彩（氣象署溫階）
 */
function getTempColor(temp: number): string {
  if (temp >= 35) return '#b71c1c';
  if (temp >= 32) return '#e53935';
  if (temp >= 28) return '#fb8c00';
  if (temp >= 25) return '#fdd835';
  if (temp >= 22) return '#7cb342';
  if (temp >= 18) return '#2e7d32';
  if (temp >= 14) return '#00897b';
  if (temp >= 10) return '#0288d1';
  return '#1565c0';
}

/**
 * 依據降雨機率回傳色彩
 */
function getRainColor(prob: number | null): string {
  if (prob === null) return '#94a3b8';
  if (prob >= 70) return '#1e40af';
  if (prob >= 50) return '#2563eb';
  if (prob >= 30) return '#0284c7';
  if (prob >= 10) return '#38bdf8';
  return '#10b981';
}

/**
 * 地圖平移控制子元件
 */
function MapController({ flyToCoords }: { flyToCoords?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (flyToCoords) {
      map.flyTo(flyToCoords, 10, { duration: 1.2 });
    }
  }, [flyToCoords, map]);
  return null;
}

// 使用者定位圖示
const userGpsIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="user-gps-pulse" title="您的所在位置"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function WeatherMap({
  weatherData,
  baseMap = 'topo',
  activeLayer = 'temp',
  selectedItem,
  onSelectItem,
  flyToCoords,
}: WeatherMapProps) {
  // 台灣中心點座標 [緯度, 經度]
  const centerPosition: [number, number] = [23.75, 120.95];

  // 自然地形底圖（Esri World Topo Map）
  const topoUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
  const topoAttribution = 'Tiles &copy; Esri &mdash; Esri, USGS, NPS';

  // 標準 OpenStreetMap 街道圖
  const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const tileUrl = baseMap === 'osm' ? osmUrl : topoUrl;
  const tileAttribution = baseMap === 'osm' ? osmAttribution : topoAttribution;

  // 依據 activeLayer 生成對應標記圖示
  const markers = useMemo(() => {
    return weatherData.map((item) => {
      let displayText = '--';
      let dotColor = '#1e293b';

      if (activeLayer === 'temp') {
        let tempNum = 24;
        if (item.max_temperature !== null && item.min_temperature !== null) {
          tempNum = Math.round(((item.max_temperature + item.min_temperature) / 2) * 10) / 10;
          displayText = `${tempNum.toFixed(1)}°`;
        } else if (item.max_temperature !== null) {
          tempNum = item.max_temperature;
          displayText = `${tempNum.toFixed(1)}°`;
        }
        dotColor = getTempColor(tempNum);
      } else if (activeLayer === 'rain') {
        displayText = item.rain_probability !== null ? `${item.rain_probability}%` : '--';
        dotColor = getRainColor(item.rain_probability);
      } else {
        const emoji = getWeatherEmoji(item.weather_description);
        displayText = `${emoji} ${item.weather_description.slice(0, 3)}`;
        dotColor = '#dda15e';
      }

      const isCurrentSelected = selectedItem?.location_name === item.location_name;

      const customIcon = L.divIcon({
        className: 'cwa-station-marker',
        html: `
          <div class="cwa-station-item ${isCurrentSelected ? 'cwa-selected' : ''}">
            <span class="cwa-dot" style="border-color: ${dotColor}; ${isCurrentSelected ? 'transform: scale(1.4); background: #dda15e; box-shadow: 0 0 0 3px #bc6c25;' : ''}"></span>
            <span class="cwa-temp">${displayText}</span>
            <span class="cwa-city" style="${isCurrentSelected ? 'background: #283618; color: #fefae0; font-weight: bold; border-color: #dda15e;' : ''}">${item.location_name}</span>
          </div>
        `,
        iconSize: [96, 24],
        iconAnchor: [5, 5],
        popupAnchor: [12, -10],
      });

      return {
        ...item,
        customIcon,
      };
    });
  }, [weatherData, activeLayer, selectedItem]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={centerPosition}
        zoom={7.8}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomControl position="bottomleft" />
        <MapController flyToCoords={flyToCoords} />

        {/* 自然地形圖 / 街道圖 */}
        <TileLayer
          key={baseMap}
          attribution={tileAttribution}
          url={tileUrl}
        />

        {/* 使用者 GPS 定位標記 */}
        {flyToCoords && (
          <Marker position={flyToCoords} icon={userGpsIcon} />
        )}

        {/* 22 縣市測站標記與 Milestone 3 增強型彈窗 */}
        {markers.map((item) => (
          <Marker
            key={item.id || item.location_name}
            position={[item.latitude, item.longitude]}
            icon={item.customIcon}
            eventHandlers={{
              click: () => {
                if (onSelectItem) {
                  onSelectItem(item);
                }
              },
            }}
          >
            <Popup>
              <div style={{ minWidth: '220px', padding: '6px 4px', fontSize: '13px', lineHeight: '1.6', color: 'var(--cornsilk)' }}>
                {/* 彈窗頂部：縣市名稱與天氣圖標 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(254, 250, 224, 0.25)',
                    paddingBottom: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '18px' }}>📍</span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--cornsilk)' }}>
                      {item.location_name}
                    </h3>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--sunlit-clay)', fontWeight: 'bold' }}>
                    {getWeatherEmoji(item.weather_description)} {item.weather_description}
                  </span>
                </div>

                {/* 氣溫區間 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(254, 250, 224, 0.75)' }}>氣溫範圍：</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--sunlit-clay)' }}>
                    {item.min_temperature !== null ? `${item.min_temperature}°C` : '--'} ~ {item.max_temperature !== null ? `${item.max_temperature}°C` : '--'}
                  </span>
                </div>

                {/* 降雨機率 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(254, 250, 224, 0.75)' }}>降雨機率：</span>
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: item.rain_probability && item.rain_probability >= 30 ? '#60a5fa' : 'var(--cornsilk)',
                    }}
                  >
                    💧 {item.rain_probability !== null ? `${item.rain_probability}%` : '無資料'}
                  </span>
                </div>

                {/* 舒適度指標 */}
                {item.comfort_index && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'rgba(254, 250, 224, 0.75)' }}>體感指標：</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(96, 108, 56, 0.5)',
                        border: '1px solid rgba(254, 250, 224, 0.2)',
                        fontSize: '11px',
                        color: 'var(--cornsilk)',
                      }}
                    >
                      {item.comfort_index}
                    </span>
                  </div>
                )}

                {/* 氣象小建議 */}
                <div
                  style={{
                    backgroundColor: 'rgba(254, 250, 224, 0.08)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.4',
                  }}
                >
                  {getWeatherAdvice(item.max_temperature, item.min_temperature, item.rain_probability)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
