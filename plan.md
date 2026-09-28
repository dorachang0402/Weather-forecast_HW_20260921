# Taiwan Weather GIS Dashboard

## 1. 專案概述

### 專案名稱

**Taiwan Weather GIS Dashboard**

### 專案目標

建立一個以中央氣象署（CWA）公開氣象資料為基礎的 Taiwan Weather GIS Web Application。

系統將從 CWA API 取得政府公開氣象資料，整理後儲存至 PostgreSQL Database，再透過 GIS 地圖將氣象資料呈現在台灣地圖上的對應位置。

最終將專案放置於 GitHub，並使用 Vercel 自動部署。

---

## 2. 專案核心資料流程

```text
中央氣象署 CWA
      │
      │ API
      ▼
CWA JSON Data
      │
      │ Data Processing
      ▼
PostgreSQL Database
      │
      │ Query
      ▼
Next.js API / Server
      │
      ▼
Taiwan GIS Web
      │
      ├── Taiwan Map
      ├── Weather Markers
      ├── Temperature
      ├── Weather Description
      └── Precipitation Probability
      │
      ▼
GitHub
      │
      ▼
Vercel
      │
      ▼
Production Web App

3. 專案開發原則
3.1 Milestone by Milestone

本專案採用：

逐步推進、分階段驗證（Milestone by Milestone）

不要一次完成整個專案。

每個 Milestone 必須完成：

開發
測試
確認結果
修正問題
Git Commit
才進入下一個 Milestone

3.2 初學者優先

我是 Python / Web / GIS 初學者。

因此：

程式碼保持簡單
避免不必要的套件
避免過度工程化
每個重要程式區塊都要有簡單註解
不要一次建立過多抽象層
不要加入目前沒有需求的功能

如果有兩種以上的實作方式：

優先選擇容易理解、容易測試、容易維護的方式。

3.3 AI Coding 原則

本專案使用 Antigravity 進行 AI-assisted / vibe coding。

但是 Antigravity 不應該一次完成整個專案。

每次只處理目前的 Milestone。

流程：

Human defines goal
        ↓
Antigravity implements
        ↓
Run / Test
        ↓
Check result
        ↓
Fix if necessary
        ↓
Git Commit
        ↓
Next Milestone
4. Tech Stack
功能	技術
Government Weather Data	CWA Open Data API
Frontend / Web	Next.js
Programming Language	TypeScript
Database	PostgreSQL
Database Platform	Supabase
GIS Map	Leaflet
React GIS Integration	React Leaflet
Map Data	Taiwan GeoJSON
Version Control	Git
Repository	GitHub
Deployment	Vercel
AI Coding	Antigravity
5. Why These Technologies
5.1 CWA API

使用中央氣象署 Open Data API 取得政府公開氣象資料。

第一階段以 CWA 天氣預報資料作為主要資料來源。

5.2 Next.js

使用 Next.js 建立 Web Application。

主要用途：

建立 Web UI
Server-side data fetching
API Route / Server functionality
與 Vercel 部署整合
5.3 TypeScript

本專案主要使用 TypeScript。

原因：

Next.js 原生支援
可以增加資料型別安全
適合處理 API JSON
適合建立前後端資料結構
5.4 PostgreSQL

使用 PostgreSQL 儲存天氣資料。

第一版使用 Supabase 提供的 PostgreSQL Database。

原因：

適合 Web Application
可以長期保存資料
可以與 Vercel 搭配
可以透過 SQL 查詢資料
5.5 Leaflet

使用 Leaflet 建立互動式地圖。

主要用途：

顯示台灣地圖
顯示 Marker
顯示天氣資料
點擊地圖位置查看資訊
5.6 GitHub

GitHub 用於：

保存程式碼
Git version control
Commit history
Project backup
Vercel deployment source
5.7 Vercel

Vercel 用於部署 Next.js Web Application。

最終目標：

Local Development
        ↓
Git Commit
        ↓
Git Push
        ↓
GitHub
        ↓
Vercel
        ↓
Automatic Deployment