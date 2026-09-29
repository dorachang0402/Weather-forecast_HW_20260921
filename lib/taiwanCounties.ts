/**
 * 台灣 22 縣市中心點經緯度常數對照表
 * 用於 GIS 地圖標記定位與氣象資料地理化
 */
export interface CountyCoordinate {
  name: string;
  latitude: number;
  longitude: number;
}

export const TAIWAN_COUNTIES: Record<string, { latitude: number; longitude: number }> = {
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

/**
 * 依據縣市名稱取得經緯度座標
 */
export function getCountyCoordinate(locationName: string): { latitude: number; longitude: number } {
  const coord = TAIWAN_COUNTIES[locationName];
  if (coord) {
    return coord;
  }
  // 預設回傳台灣中心點 (南投)
  return { latitude: 23.9756, longitude: 120.9738 };
}
