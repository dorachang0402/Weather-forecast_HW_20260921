import sqlite3
import sys
from pathlib import Path
import pandas as pd

# 設定輸出編碼為 UTF-8
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# 1. 連接目前的 weather.db
db_path = Path(__file__).resolve().parent / 'weather.db'

if not db_path.exists():
    raise FileNotFoundError(f"找不到 SQLite 資料庫檔案: {db_path}")

conn = sqlite3.connect(db_path)

# 設定 Pandas 輸出排版
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)
pd.set_option('display.unicode.east_asian_width', True)

print("=" * 80)
print("🔍 執行 SQLite 資料庫 SQL 檢查作業")
print("=" * 80)

# 查詢 1：查詢資料總筆數
sql_1 = "SELECT COUNT(*) AS total_records FROM weather_forecasts;"
df_1 = pd.read_sql_query(sql_1, conn)
print("\n【查詢 1：資料總筆數】")
print(f"SQL 語法: {sql_1}")
print(df_1.to_string(index=False))

# 查詢 2：查詢有哪些縣市（不重複清單與計數）
sql_2 = """
SELECT 
    location_name, 
    COUNT(*) AS records_count,
    latitude,
    longitude
FROM weather_forecasts
GROUP BY location_name
ORDER BY id ASC;
"""
df_2 = pd.read_sql_query(sql_2, conn)
print("\n" + "-" * 80)
print("【查詢 2：縣市清單與每縣市資料筆數】")
print(f"SQL 語法: {sql_2.strip()}")
print(df_2.to_string(index=False))
print(f"\n👉 共有 {len(df_2)} 個縣市。")

# 查詢 3：查詢各縣市的最高溫（按溫度由高到低排序）
sql_3 = """
SELECT 
    location_name, 
    MAX(max_temperature) AS highest_temp,
    MIN(min_temperature) AS lowest_temp
FROM weather_forecasts
GROUP BY location_name
ORDER BY highest_temp DESC, lowest_temp ASC;
"""
df_3 = pd.read_sql_query(sql_3, conn)
print("\n" + "-" * 80)
print("【查詢 3：各縣市預報之最高溫與最低溫排行】")
print(f"SQL 語法: {sql_3.strip()}")
print(df_3.to_string(index=False))

# 查詢 4：查詢全台最高溫及所在縣市
sql_4 = """
SELECT 
    location_name,
    max_temperature AS highest_temp,
    min_temperature,
    weather_description,
    start_time,
    end_time
FROM weather_forecasts
WHERE max_temperature = (SELECT MAX(max_temperature) FROM weather_forecasts);
"""
df_4 = pd.read_sql_query(sql_4, conn)
print("\n" + "-" * 80)
print("【查詢 4：全台最高溫紀錄】")
print(f"SQL 語法: {sql_4.strip()}")
print(df_4.to_string(index=False))

# 查詢 5：查詢全台最低溫及所在縣市
sql_5 = """
SELECT 
    location_name,
    min_temperature AS lowest_temp,
    max_temperature,
    weather_description,
    start_time,
    end_time
FROM weather_forecasts
WHERE min_temperature = (SELECT MIN(min_temperature) FROM weather_forecasts);
"""
df_5 = pd.read_sql_query(sql_5, conn)
print("\n" + "-" * 80)
print("【查詢 5：全台最低溫紀錄】")
print(f"SQL 語法: {sql_5.strip()}")
print(df_5.to_string(index=False))

conn.close()
print("\n" + "=" * 80)
print("✅ SQL 資料檢查全部執行完畢！")
print("=" * 80)
