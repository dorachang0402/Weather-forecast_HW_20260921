/**
 * 氣象輔助函式庫（純函式，不依賴 Leaflet / DOM，可在 SSR 安全執行）
 */

/**
 * 天氣現象對應 Emoji
 */
export function getWeatherEmoji(desc: string = ''): string {
  if (desc.includes('雷')) return '⛈️';
  if (desc.includes('雨')) return '🌧️';
  if (desc.includes('陰')) return '☁️';
  if (desc.includes('多雲')) return '⛅';
  if (desc.includes('晴')) return '☀️';
  if (desc.includes('霧')) return '🌫️';
  return '🌤️';
}

/**
 * 依據氣象數據生成生活貼心建議
 */
export function getWeatherAdvice(maxT: number | null, minT: number | null, pop: number | null): string {
  if (pop !== null && pop >= 40) return '☔ 降雨機率偏高，出門請備妥雨具！';
  if (maxT !== null && maxT >= 32) return '🧴 白天炎熱紫外線強，注意防曬並補充水分。';
  if (minT !== null && minT <= 18) return '🧣 日夜溫差偏大，早晚外出建議帶件薄外套。';
  return '🌿 天候大致舒適，適宜戶外活動與散步。';
}
