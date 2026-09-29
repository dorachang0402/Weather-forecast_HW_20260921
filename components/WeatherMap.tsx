'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 修正 Leaflet 預設 Marker 圖示載入問題
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
}

export default function WeatherMap({ weatherData }: WeatherMapProps) {
  // 台灣中心點座標 [緯度, 經度]
  const centerPosition: [number, number] = [23.7, 120.9];

  return (
    <div style={{ width: '100%', height: '600px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
      <MapContainer
        center={centerPosition}
        zoom={7.5}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        {/* OpenStreetMap 底圖圖層 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 遍歷並建立 22 縣市 Marker */}
        {weatherData.map((item) => (
          <Marker
            key={item.id || item.location_name}
            position={[item.latitude, item.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <div style={{ minWidth: '160px', padding: '2px 4px', fontSize: '14px', lineHeight: '1.6' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
                  📍 {item.location_name}
                </h3>
                <div><strong>天氣：</strong>{item.weather_description}</div>
                <div><strong>最低溫：</strong>{item.min_temperature !== null ? `${item.min_temperature} °C` : '無資料'}</div>
                <div><strong>最高溫：</strong>{item.max_temperature !== null ? `${item.max_temperature} °C` : '無資料'}</div>
                <div><strong>降雨機率：</strong>{item.rain_probability !== null ? `${item.rain_probability} %` : '無資料'}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
