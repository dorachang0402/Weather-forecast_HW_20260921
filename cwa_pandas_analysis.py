import os
import sys
from pathlib import Path
import requests
import urllib3
import pandas as pd
from dotenv import load_dotenv

# 忽略 SSL 警告（台灣政府部分公開 API 憑證相容性設定）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 解決 Windows 控制台輸出編碼問題
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# 1. 讀取 .env.local 取得 CWA API Key
env_path = Path(__file__).resolve().parent / '.env.local'
if not env_path.exists():
    env_path = Path(__file__).resolve().parent / '.env'

load_dotenv(dotenv_path=env_path)
api_key = os.getenv('CWA_API_KEY')

if not api_key:
    raise ValueError("找不到 CWA_API_KEY，請確認 .env.local 檔案存在並包含 CWA_API_KEY。")

# 2. 呼叫中央氣象署 CWA API (F-C0032-001: 36小時天氣預報)
api_url = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001"
params = {
    "Authorization": api_key,
    "format": "JSON"
}

print("正在從中央氣象署 CWA API 下載氣象預報資料...")
response = requests.get(api_url, params=params, verify=False, timeout=15)
response.raise_for_status()
data = response.json()

# 3. 解析 JSON 資料結構
locations = data.get("records", {}).get("location", [])
parsed_records = []

for loc in locations:
    location_name = loc.get("locationName")
    weather_elements = loc.get("weatherElement", [])
    
    # 建立天氣要素名稱對應字典
    element_map = {el.get("elementName"): el.get("time", []) for el in weather_elements}
    
    wx_times = element_map.get("Wx", [])
    pop_times = element_map.get("PoP", [])
    min_t_times = element_map.get("MinT", [])
    max_t_times = element_map.get("MaxT", [])
    
    # 每個縣市有 3 個預報時段 (12小時為一個時段)
    for i in range(len(wx_times)):
        wx_item = wx_times[i]
        pop_item = pop_times[i] if i < len(pop_times) else {}
        min_t_item = min_t_times[i] if i < len(min_t_times) else {}
        max_t_item = max_t_times[i] if i < len(max_t_times) else {}
        
        start_time = wx_item.get("startTime")
        end_time = wx_item.get("endTime")
        weather_desc = wx_item.get("parameter", {}).get("parameterName")
        
        min_temp_str = min_t_item.get("parameter", {}).get("parameterName")
        max_temp_str = max_t_item.get("parameter", {}).get("parameterName")
        pop_str = pop_item.get("parameter", {}).get("parameterName")
        
        # 數值型態轉換 (溫度轉為 float，降雨機率轉為 int)
        min_temp = float(min_temp_str) if min_temp_str is not None and min_temp_str != '' else None
        max_temp = float(max_temp_str) if max_temp_str is not None and max_temp_str != '' else None
        pop = int(pop_str) if pop_str is not None and pop_str != '' else None
        
        parsed_records.append({
            "location_name": location_name,
            "start_time": start_time,
            "end_time": end_time,
            "weather_description": weather_desc,
            "MinT": min_temp,
            "MaxT": max_temp,
            "PoP": pop
        })

# 4. 轉換為 Pandas DataFrame
df = pd.DataFrame(parsed_records)

# 5. 印出觀察資料
print("\n" + "=" * 80)
print("【Pandas DataFrame 前 10 筆資料預覽】")
print("=" * 80)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)
pd.set_option('display.unicode.east_asian_width', True)
print(df.head(10))

print("\n" + "=" * 80)
print("【DataFrame 基本資訊】")
print("=" * 80)
print(f"• 總筆數 (Rows): {len(df)} 筆")
print(f"• 縣市數量 (Unique Locations): {df['location_name'].nunique()} 個縣市")
print(f"• 欄位清單 (Columns): {list(df.columns)}")

print("\n" + "=" * 80)
print("【氣溫與降雨機率統計摘要】")
print("=" * 80)
print(df[["MinT", "MaxT", "PoP"]].describe())

print("\n" + "=" * 80)
print("【最高溫與最低溫檢查】")
print("=" * 80)
max_record = df.loc[df["MaxT"].idxmax()]
min_record = df.loc[df["MinT"].idxmin()]
print(f"🔥 全台最高溫: {max_record['MaxT']}°C ({max_record['location_name']}, 預報時段: {max_record['start_time']} ~ {max_record['end_time']})")
print(f"❄️ 全台最低溫: {min_record['MinT']}°C ({min_record['location_name']}, 預報時段: {min_record['start_time']} ~ {min_record['end_time']})")
