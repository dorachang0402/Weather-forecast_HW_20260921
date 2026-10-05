import sqlite3
from pathlib import Path
import folium
import pandas as pd
import streamlit as st
from streamlit_folium import st_folium

# 1. 網頁頁面基礎設定
st.set_page_config(
    page_title="台灣氣象預報 GIS Dashboard",
    page_icon="🌤️",
    layout="wide"
)

# 2. 標題與簡短說明（符合課程展示需求）
st.title("🌤️ 台灣氣象預報 GIS Dashboard")
st.caption("資料來源：中央氣象署 CWA API")

# 3. 讀取 SQLite 資料庫所有預報資料
@st.cache_data
def load_all_weather_data():
    db_path = Path(__file__).resolve().parent / "weather.db"
    if not db_path.exists():
        st.error(f"找不到資料庫檔案：{db_path}")
        return pd.DataFrame()

    conn = sqlite3.connect(db_path)
    sql = """
    SELECT 
        location_name,
        latitude,
        longitude,
        weather_description,
        min_temperature,
        max_temperature,
        rain_probability,
        start_time,
        end_time
    FROM weather_forecasts
    ORDER BY start_time ASC, id ASC;
    """
    df = pd.read_sql_query(sql, conn)
    conn.close()
    return df

df_all = load_all_weather_data()

if df_all.empty:
    st.warning("⚠️ 資料庫中尚無天氣資料。")
else:
    # 4. 取得 3 個預報時段
    time_slots = df_all[['start_time', 'end_time']].drop_duplicates().reset_index(drop=True)
    
    # 格式化時段標籤
    slot_labels = [
        f"時段 {i+1}：{row['start_time']} 至 {row['end_time']}"
        for i, row in time_slots.iterrows()
    ]

    # 5. 提供 3 個預報時段切換功能
    st.subheader("⏱️ 預報時段切換")
    selected_index = st.radio(
        label="請選擇欲檢視的預報時段：",
        options=range(len(slot_labels)),
        format_func=lambda i: slot_labels[i],
        horizontal=True
    )

    # 取得選定時段資料
    selected_start = time_slots.iloc[selected_index]['start_time']
    df_selected = df_all[df_all['start_time'] == selected_start].copy()

    st.success(f"📍 目前顯示：**{slot_labels[selected_index]}**（全台共 {len(df_selected)} 個縣市）")

    # 6. 建立 Folium 台灣地圖（中心點設為台灣中心：23.8°N, 120.9°E）
    taiwan_map = folium.Map(
        location=[23.8, 120.9],
        zoom_start=8,
        tiles="OpenStreetMap"
    )

    # 7. 在地圖上為 22 個縣市加入 Marker
    for _, row in df_selected.iterrows():
        popup_html = f"""
        <div style="font-family: sans-serif; min-width: 160px;">
            <h4 style="margin: 0 0 6px 0; color: #1E3A8A;">📍 {row['location_name']}</h4>
            <div style="font-size: 0.8rem; color: #6B7280; margin-bottom: 6px;">{row['start_time']} ~ {row['end_time']}</div>
            <hr style="margin: 4px 0 8px 0;">
            <p style="margin: 3px 0;"><b>天氣現象：</b>{row['weather_description']}</p>
            <p style="margin: 3px 0;"><b>最高溫：</b><span style="color: #DC2626; font-weight: bold;">{row['max_temperature']}°C</span></p>
            <p style="margin: 3px 0;"><b>最低溫：</b><span style="color: #2563EB; font-weight: bold;">{row['min_temperature']}°C</span></p>
            <p style="margin: 3px 0;"><b>降雨機率：</b>{row['rain_probability']}%</p>
        </div>
        """
        
        tooltip_text = f"{row['location_name']}：{row['weather_description']} | {row['min_temperature']}°C ~ {row['max_temperature']}°C (降雨機率 {row['rain_probability']}%)"

        # 根據最高溫設定標記顏色
        max_t = row['max_temperature']
        marker_color = "red" if max_t >= 32 else "orange" if max_t >= 28 else "blue"

        folium.Marker(
            location=[row['latitude'], row['longitude']],
            popup=folium.Popup(popup_html, max_width=280),
            tooltip=tooltip_text,
            icon=folium.Icon(color=marker_color, icon="cloud", prefix="fa")
        ).add_to(taiwan_map)

    # 8. 在 Streamlit 中呈現 Folium 地圖
    st_folium(taiwan_map, width="100%", height=600, key=f"weather_map_slot_{selected_index}")

    # 9. 下方 22 個縣市資料明細表
    st.subheader(f"📊 【時段 {selected_index + 1}】22 縣市天氣資料明細")
    st.dataframe(
        df_selected[[
            "location_name", 
            "weather_description", 
            "min_temperature", 
            "max_temperature", 
            "rain_probability",
            "start_time",
            "end_time"
        ]].rename(columns={
            "location_name": "縣市名稱",
            "weather_description": "天氣現象",
            "min_temperature": "最低溫 (°C)",
            "max_temperature": "最高溫 (°C)",
            "rain_probability": "降雨機率 (%)",
            "start_time": "預報開始時間",
            "end_time": "預報結束時間"
        })
    )
