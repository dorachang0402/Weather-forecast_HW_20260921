# Alo DIC-2 — Taiwan Weather GIS Dashboard

## 1. Project Overview

**Project name:** Alo DIC-2 Taiwan Weather GIS Dashboard

**Goal:**  
Build an interactive Taiwan weather GIS website that collects weather data from the Central Weather Administration (CWA) Open Data API, stores structured weather data in a database, connects the data with Taiwan administrative GIS boundaries, and deploys the web application through GitHub and Vercel.

### Core data flow

```text
CWA Open Data API
        ↓
     JSON Data
        ↓
  Data Processing
        ↓
   PostgreSQL DB
        ↓
Taiwan GIS + Weather Data
        ↓
Interactive Web Map
        ↓
      GitHub
        ↓
      Vercel
        ↓
   Live Web Application
```

---

## 2. Project Objectives

The project demonstrates an end-to-end data application workflow:

1. Connect to a government open-data API.
2. Retrieve Taiwan weather forecast data.
3. Parse and normalize JSON data.
4. Store weather data in a database.
5. Obtain Taiwan county/city GIS boundaries.
6. Combine geographic data with weather data.
7. Build an interactive Taiwan weather GIS website.
8. Version-control the project with GitHub.
9. Automatically deploy the application through Vercel.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Weather Data | CWA Open Data API |
| CWA Dataset | F-C0032-001 |
| Data Format | JSON |
| Frontend / Backend | Next.js |
| Programming Language | TypeScript |
| Database | PostgreSQL |
| Database Provider | Neon |
| GIS Boundary | Taiwan County/City GeoJSON |
| Map | Leaflet |
| Version Control | Git / GitHub |
| Deployment | Vercel |
| Development Assistant | Antigravity |

---

## 4. CWA Data Source

### Dataset

**F-C0032-001 — 一般天氣預報-今明36小時天氣預報**

The first version will use the CWA 36-hour weather forecast dataset.

Expected weather fields include:

- `locationName`
- `startTime`
- `endTime`
- `Wx` — weather condition
- `MaxT` — maximum temperature
- `MinT` — minimum temperature
- `CI` — comfort index
- `PoP` — precipitation probability

### API Key

The CWA API key must be stored as an environment variable.

```env
CWA_API_KEY=YOUR_CWA_API_KEY
```

### Security rules

- Never hard-code the API key.
- Never commit the API key to GitHub.
- Never expose the API key through `NEXT_PUBLIC_*`.
- Store the production API key in Vercel Environment Variables.
- Keep `.env.local` in `.gitignore`.

---

## 5. System Architecture

```text
                         ┌──────────────────────┐
                         │   CWA Open Data API  │
                         │     F-C0032-001      │
                         └──────────┬───────────┘
                                    │
                                    │ JSON
                                    ▼
                         ┌──────────────────────┐
                         │   CWA API Client     │
                         │      cwa.ts           │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Data Processing    │
                         │   Parse / Normalize  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   PostgreSQL / Neon  │
                         │ weather_forecasts    │
                         └──────────┬───────────┘
                                    │
                       ┌────────────┴────────────┐
                       │                         │
                       ▼                         ▼
              ┌─────────────────┐      ┌─────────────────┐
              │ Taiwan GeoJSON   │      │ Weather Data    │
              │ County Boundaries│      │ from Database   │
              └────────┬────────┘      └────────┬────────┘
                       │                         │
                       └────────────┬────────────┘
                                    ▼
                         ┌──────────────────────┐
                         │    Taiwan GIS Map    │
                         │      Leaflet         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Next.js Web App   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │        GitHub         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Vercel          │
                         │   Automatic Deploy    │
                         └──────────────────────┘
```

---

# 6. Development Milestones

## Milestone 1 — CWA API

### Goal

Prove that the application can securely connect to the CWA API and retrieve JSON data.

### Requirements

- Create a Next.js + TypeScript project.
- Create a server-side CWA API client.
- Read the API key from `CWA_API_KEY`.
- Use dataset `F-C0032-001`.
- Handle API errors.
- Handle timeout.
- Handle missing API key.
- Validate that the returned response has the expected structure.

### Do not implement yet

- Database
- GIS map
- Final UI
- Vercel deployment

### Success criteria

The application can successfully retrieve the CWA JSON response without exposing the API key.

---

## Milestone 2 — Data Processing

### Goal

Convert the CWA JSON response into a clean, structured data format.

### Target structure

```ts
{
  location: "臺中市",
  startTime: "...",
  endTime: "...",
  weather: "多雲",
  minTemp: 25,
  maxTemp: 33,
  precipitationProbability: 30
}
```

### Requirements

- Extract county/city name.
- Extract forecast time.
- Extract weather condition.
- Extract minimum temperature.
- Extract maximum temperature.
- Extract precipitation probability.
- Convert numeric fields to numbers.
- Handle missing values.
- Keep parsing logic separate from the UI.

### Success criteria

The application produces a predictable structured dataset that can be stored in the database.

---

## Milestone 3 — PostgreSQL Database

### Goal

Store normalized CWA weather data in PostgreSQL.

### Database

Use PostgreSQL through Neon.

### Initial table

`weather_forecasts`

| Column | Type | Description |
|---|---|---|
| `id` | serial / integer | Primary key |
| `location_name` | text | County/city name |
| `start_time` | timestamp/text | Forecast start |
| `end_time` | timestamp/text | Forecast end |
| `weather` | text | Weather condition |
| `min_temp` | numeric | Minimum temperature |
| `max_temp` | numeric | Maximum temperature |
| `precipitation_probability` | numeric | Rain probability |
| `updated_at` | timestamp | Database update time |

### Requirements

Create functions for:

```text
initialize / migrate database
insert weather forecasts
query weather by location
query weather by date/time
query all locations
```

### Data flow

```text
CWA API
   ↓
JSON
   ↓
Parser
   ↓
PostgreSQL
```

### Success criteria

CWA weather records can be inserted and queried successfully from PostgreSQL.

---

## Milestone 4 — Taiwan GIS

### Goal

Create a Taiwan map using local geographic boundary data.

### GIS data

Use a Taiwan county/city boundary GeoJSON dataset.

The GeoJSON should contain enough information to identify each county/city, such as:

```text
COUNTYNAME
COUNTYCODE
geometry
```

### First version

The map should:

- Display Taiwan.
- Display county/city boundaries.
- Identify individual counties/cities.
- Allow the user to click a county/city.
- Display the selected county/city name.

### Important

Do not connect weather data yet.

First prove that the GIS layer works independently.

### Success criteria

A user can open the website and click a Taiwan county/city on the map.

---

## Milestone 5 — GIS + Weather Integration

### Goal

Connect geographic locations with weather data.

### Data relationship

```text
GeoJSON
   │
   │ location name
   ▼
County / City
   │
   │ lookup
   ▼
PostgreSQL
   │
   ▼
Weather Forecast
```

### Example

When the user clicks:

```text
臺中市
```

the map should display:

```text
臺中市

Weather: 多雲
Minimum Temperature: 25°C
Maximum Temperature: 33°C
Precipitation Probability: 30%
```

### Success criteria

Every supported county/city can display the corresponding weather information.

---

# 7. Web Interface

## Main page

The first version should remain simple.

```text
┌───────────────────────────────────────────┐
│     Taiwan Weather GIS Dashboard          │
│     CWA Open Data × GIS                   │
├───────────────────────────────────────────┤
│                                           │
│              Taiwan Map                   │
│                                           │
│       ● Taipei                             │
│              ● Taichung                    │
│                                           │
│                       ● Kaohsiung          │
│                                           │
├───────────────────────────────────────────┤
│ Selected Location: 臺中市                  │
│                                           │
│ Weather: 多雲                              │
│ Min Temperature: 25°C                     │
│ Max Temperature: 33°C                     │
│ Precipitation Probability: 30%            │
└───────────────────────────────────────────┘
```

### UI principles

- Clean and simple.
- Traditional Chinese.
- Map is the main visual element.
- Avoid unnecessary dashboard components.
- Prioritize data clarity over decoration.
- Responsive layout.

---

# 8. Recommended Project Structure

```text
alo-dic2-taiwan-weather-gis/
│
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── api/
│       └── weather/
│           └── route.ts
│
├── components/
│   ├── TaiwanMap.tsx
│   ├── WeatherPopup.tsx
│   └── WeatherCard.tsx
│
├── lib/
│   ├── cwa.ts
│   ├── database.ts
│   └── weather.ts
│
├── data/
│   └── taiwan-counties.geojson
│
├── scripts/
│   └── fetch-weather.ts
│
├── public/
│
├── tests/
│
├── .env.local
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

# 9. GitHub Workflow

GitHub should be used throughout development rather than only at the end.

### Recommended commits

```text
init: initialize Next.js project

feat: add CWA API client

feat: add weather data parser

feat: add PostgreSQL database

feat: add Taiwan GeoJSON map

feat: connect weather data to GIS

feat: add weather popup

fix: handle missing weather data

docs: update README
```

### Security

Never commit:

```text
.env.local
API keys
database passwords
private credentials
```

Commit:

```text
.env.example
```

Example:

```env
CWA_API_KEY=YOUR_CWA_API_KEY
DATABASE_URL=YOUR_DATABASE_URL
```

---

# 10. Vercel Deployment

## Deployment architecture

```text
GitHub
   ↓
Vercel
   ↓
Next.js Application
   ↓
Neon PostgreSQL
```

### Environment variables

Configure these in Vercel:

```text
CWA_API_KEY
DATABASE_URL
```

### Automatic deployment

```text
Antigravity
    ↓
git commit
    ↓
git push
    ↓
GitHub
    ↓
Vercel detects change
    ↓
Build
    ↓
Deploy
```

Every approved change pushed to the main branch should trigger a new deployment.

---

# 11. Security Rules

1. CWA API keys must remain server-side.
2. Never use `NEXT_PUBLIC_CWA_API_KEY`.
3. Never hard-code secrets.
4. Never commit `.env.local`.
5. Never expose database credentials.
6. Validate external API responses.
7. Handle API failures gracefully.
8. Use parameterized database queries.
9. Do not expose unnecessary database information through API routes.

---

# 12. AI-Assisted Development Workflow

Antigravity will be used as a development assistant.

The workflow is:

```text
Human
  ↓
Define requirement
  ↓
Antigravity
  ↓
Plan
  ↓
Human reviews plan
  ↓
Antigravity implements
  ↓
Run / Test
  ↓
Human verifies result
  ↓
Fix
  ↓
Git commit
  ↓
GitHub
```

### Important rule

Do not ask Antigravity to build the entire project at once.

Work milestone by milestone.

For each milestone:

1. Ask Antigravity to analyze.
2. Review its proposed implementation.
3. Approve the plan.
4. Let it implement only that milestone.
5. Run the application.
6. Test the result.
7. Review the code.
8. Commit the change.
9. Move to the next milestone.

---

# 13. Milestone 1 — Antigravity Prompt

Use the following prompt for the first development task:

```text
I am building a project called:

Alo DIC-2 Taiwan Weather GIS Dashboard

Goal:
Build an interactive Taiwan weather GIS website using:

- CWA Open Data API
- Next.js
- TypeScript
- PostgreSQL
- GeoJSON
- Leaflet
- GitHub
- Vercel

The first milestone is ONLY:

CWA API → JSON

Requirements:

1. Create a Next.js + TypeScript project.
2. Create a server-side CWA API client.
3. Read the CWA API key from:
   CWA_API_KEY
4. Never expose the API key to the browser.
5. Never hard-code the API key.
6. Add .env.local to .gitignore.
7. Use CWA dataset:
   F-C0032-001
8. Create a simple server-side test endpoint that fetches the CWA data.
9. Handle:
   - HTTP errors
   - timeout
   - invalid API response
   - missing API key
10. Do NOT create the GIS map yet.
11. Do NOT create the database yet.
12. Do NOT create the final UI yet.

First show me:
- proposed folder structure
- API request flow
- files you plan to create

Wait for approval before implementing.
```

---

# 14. Definition of Done

The project is complete when:

### Data

- [ ] CWA API connection works.
- [ ] Weather JSON can be retrieved.
- [ ] Weather data is parsed correctly.
- [ ] Weather data is stored in PostgreSQL.

### GIS

- [ ] Taiwan GeoJSON loads.
- [ ] County/city boundaries are visible.
- [ ] County/city can be selected.
- [ ] Weather data appears for the selected location.

### Web

- [ ] Website works locally.
- [ ] Map is interactive.
- [ ] Weather information is readable.
- [ ] Errors are handled gracefully.
- [ ] Responsive layout works.

### GitHub

- [ ] Source code is pushed.
- [ ] README is complete.
- [ ] No secrets are committed.
- [ ] Git history shows meaningful milestones.

### Deployment

- [ ] Vercel deployment succeeds.
- [ ] Environment variables are configured.
- [ ] Production website can access the database.
- [ ] GitHub push triggers automatic deployment.

---

# 15. Final Project Story

The final project should be explainable in one sentence:

> **This project collects Taiwan weather forecast data from the CWA government Open Data API, stores and manages the data in PostgreSQL, integrates it with Taiwan county/city GIS boundaries, and presents the results through an interactive web map deployed automatically with GitHub and Vercel.**

### Core architecture

```text
Government Open Data
        ↓
      CWA API
        ↓
      JSON
        ↓
 Data Processing
        ↓
   PostgreSQL
        ↓
Taiwan GeoJSON
        ↓
   GIS Mapping
        ↓
    Next.js
        ↓
     GitHub
        ↓
     Vercel
        ↓
   Live Website
```

**Project principle:**

> Build small → test → verify → commit → continue.