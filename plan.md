# Taiwan Weather GIS Dashboard

## 1. 專案概述

### 專案名稱

**Taiwan Weather GIS Dashboard**

### 專案目標

建立一個以中央氣象署（CWA）公開氣象資料為基礎的 Taiwan Weather GIS Web Application。

系統將從 CWA API 取得政府公開氣象資料，整理後儲存至本地 SQLite Database（`weather.db`），再透過 GIS 地圖將氣象資料呈現在台灣地圖上的對應位置。

專案使用 Git 進行版本控制，並將程式碼保存與託管於 GitHub。

---

## 2. 專案核心資料流程

```text
中央氣象署 CWA
      │
      │ API (F-C0032-001)
      ▼
CWA JSON Data
      │
      │ Data Processing & Upsert
      ▼
SQLite Database (weather.db)
      │
      │ Query
      ▼
Next.js API Route (/api/weather)
      │
      ▼
Taiwan Weather GIS Web
      │
      ├── 全螢幕 GIS 地圖 (Esri World Topo 自然地形 / OSM 街道圖)
      ├── 左上角即時氣象卡 (最高溫 / 最低溫 / 降雨機率 / 22 縣市切換)
      ├── 右上角控制面板 (圖層切換 / 底圖切換 / 📌 定位我的位置)
      ├── 右下角氣象署標準垂直色階圖例 (溫度 / 降雨)
      └── 測站數值標記與詳細氣象 Popup
      │
      ▼
GitHub Repository (Version Control)
```

---

## 3. 專案開發原則

### 3.1 Milestone by Milestone

本專案採用：**逐步推進、分階段驗證（Milestone by Milestone）**。

不要一次完成整個專案。每個 Milestone 必須完成：
1. 開發
2. 測試
3. 確認結果
4. 修正問題
5. Git Commit

才進入下一個 Milestone。

### 3.2 初學者優先

我是 Python / Web / GIS 初學者。因此：
* 程式碼保持簡單
* 避免不必要的套件
* 避免過度工程化
* 每個重要程式區塊都要有簡單註解
* 不要一次建立過多抽象層
* 不要加入目前沒有需求的功能

如果有兩種以上的實作方式：**優先選擇容易理解、容易測試、容易維護的方式。**

### 3.3 AI Coding 原則

本專案使用 Antigravity 進行 AI-assisted / vibe coding。

每次只處理目前的 Milestone。流程：
`Human defines goal ➔ Antigravity implements ➔ Run / Test ➔ Check result ➔ Fix if necessary ➔ Git Commit ➔ Next Milestone`

---

## 4. Tech Stack

| 功能 / 角色 | 技術 | 說明 |
| :--- | :--- | :--- |
| **Government Weather Data** | CWA Open Data API | 中央氣象署 36 小時天氣預報公開資料 (F-C0032-001) |
| **Frontend / Web** | Next.js (App Router) | React 全端 Web 框架 |
| **Programming Language** | TypeScript / Python | 前端為 TypeScript，後端與輔助分析包含 Python |
| **Database** | SQLite (`weather.db`) | 輕量化嵌入式關聯資料庫，透過 `better-sqlite3` 連線 |
| **GIS Map** | Leaflet | 輕量且成熟之互動式 GIS 地圖核心 |
| **React GIS Integration** | React Leaflet | Leaflet 的 React 元件化封裝 |
| **Map Tiles** | Esri World Topo / OSM | Esri 自然地形圖（仿氣象署真實地貌）與 OpenStreetMap 街道圖 |
| **Styling** | Vanilla CSS + Tokens | 森林大地 5 色系自訂 Design Tokens 與毛玻璃介面 |
| **Version Control** | Git | 原始碼版本控管 |
| **Repository** | GitHub | 雲端程式碼託管與備份 |
| **AI Coding** | Antigravity | 智慧程式碼輔助與結對開發 |

---

## 5. 技術選型說明

### 5.1 CWA API
使用中央氣象署 Open Data API 取得政府公開氣象資料，以預報資料作為主要資料來源。

### 5.2 Next.js
使用 Next.js 建立現代化 Web Application：
* 建立響應式 Web UI
* 提供 Client-side GIS 互動
* 內建 API Route (`/api/weather`) 進行本地資料庫查詢

### 5.3 TypeScript
前端主要使用 TypeScript，增加資料型別安全性，適合處理 API JSON 與地圖標記結構。

### 5.4 SQLite Database
使用本地 SQLite (`weather.db`) 儲存與快取氣象資料：
* 符合「初學者優先」原則，免除雲端資料庫複雜連線與收費設定
* 單一檔案即可長期保存與重複讀取
* 支援標準 SQL 語法進行查詢與 Upsert 批次更新

### 5.5 Leaflet & React Leaflet
使用 Leaflet 建立滿版互動式 GIS 地圖：
* 顯示台灣真實自然地形底圖
* 標記全台 22 縣市測站位置與即時數值
* 支援平滑平移（FlyTo）與 GPS 定位功能

### 5.6 GitHub
用於保存專案原始碼、記錄 Commit 歷程與版本備份。

---

## 6. 目前網頁功能與規格記錄 (已完成)

### 6.1 視覺與介面設計
* **森林大地 5 核心色系**：
  * `--black-forest: #283618`（深墨綠：主背景、毛玻璃底色、彈窗底色）
  * `--cornsilk: #fefae0`（暖白：文字、標題、微光邊框）
  * `--olive-leaf: #606c38`（橄欖綠：按鈕選中態、舒適溫度徽章）
  * `--sunlit-clay: #dda15e`（陶土金黃：次要強調、舒適標籤、旋轉指示器）
  * `--copperwood: #bc6c25`（紅銅暖褐：定位按鈕、高溫標記、警示卡片）
* **全螢幕 100vh GIS 佈局**：地圖鋪滿全螢幕，所有操作與資訊均以毛玻璃浮動卡片呈現。
* **氣象署標準真實底圖**：採用 Esri World Topo 自然地形圖，清晰呈現中央山脈與海岸線，無奇怪負片色彩。

### 6.2 左上角即時氣象資訊卡
* **免時段切分**：直接呈現最新即時預報。
* **全台 22 縣市快速切換選單**：支援下拉選單直接選擇縣市，地圖自動 FlyTo 鎖定該處。
* **三大即時指標**：最高溫（🔥 紅色）、最低溫（❄️ 藍色）、降雨機率（💧 暖金色）。
* **體感舒適度與生活叮嚀**：依據溫度與雨量動態生成生活建議（防曬、帶傘、保暖）。

### 6.3 右上角浮動操作面板
* **圖層切換**：氣溫分布 🌡️、降雨機率 🌧️、天氣現象 ⛅（動態 Emoji 標記）。
* **底圖切換**：自然地形圖 🗺️ 與標準街道圖 🛣️。
* **📌 定位我的位置**：瀏覽器原生 GPS 定位，自動飛行聚焦至所在地並標示藍色脈衝雷達，連動左上角資訊卡為最近縣市。

### 6.4 右下角垂直色階圖例
* **氣溫圖層**：呈現氣象署官方 21 階色彩條與 -1°C ~ 38°C 數值標記。
* **降雨圖層**：自動切換為 0% ~ 100% 降雨機率色階條。

### 6.5 測站標記與互動彈窗
* 比照氣象署溫度分布圖規格（白色黑邊小圓點 + 傾斜高對比度粗體數值）。
* 點擊任意測站展開精緻氣象卡 Popup，同時雙向連動左上角即時氣象卡。