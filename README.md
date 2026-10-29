# 🌍 Atlas Kids Explorer

> An interactive, educational world geography word-chain game designed for curious explorers aged 8–12. 
> 
> *Built from scratch during an all-nighter for my younger sister—to make learning countries, capitals, and continents feel like an expedition rather than homework.*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon_Postgres_18-00E599?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet_OpenStreetMap-199900?style=flat-square&logo=leaflet)](https://leafletjs.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## 🎒 What is Atlas Kids?

Remember the classic car-ride or classroom game of **Atlas**?
- You say a place: **"Delhi"** (ends in **I**).
- Opponent must name a place starting with **I**: **"India"** (ends in **A**).
- Next turn needs an **A**: **"Amsterdam"**... and so on!

Most digital geography games either ask multiple-choice trivia or depend on unpredictable AI models that hallucinate fake islands. **Atlas Kids** is grounded in a verified database of **157,943 real-world places** and backed by thoughtful game design rules tailored specifically for young learners.

---

## ✨ Features Built for Young Explorers

### 1. 🏆 The 4-Tier Educational Priority System
If a kid plays a word ending in **Z**, an unguided database might answer with *"Zarubino"* (a tiny village of 2,000 people in Russia). That teaches nothing and frustrates kids.

Our engine categorizes all 158,000 records into an educational hierarchy:
- **Tier 1 (Highest Priority):** Sovereign Countries *(India, France, Brazil)*
- **Tier 2 (Second Priority):** National Capitals *(New Delhi, Paris, Tokyo)*
- **Tier 3 (Third Priority):** Major States, Provinces & Territories *(California, Bavaria, Maharashtra)*
- **Tier 4 (Fallback):** Cities & Towns *(Lyon, Pune, Austin)*

When Atlas AI takes its turn, it queries `ORDER BY tier ASC, RANDOM() LIMIT 1`. It will **always teach a country or capital first** before dipping into regional towns.

### 2. 💡 Compassionate Typo Correction (No Frustration)
Kids make spelling mistakes. If an 8-year-old types `Indonasia`, standard databases throw a red error: *"Invalid place, you lose!"*. 

Atlas Kids uses PostgreSQL's `pg_trgm` (trigram fuzzy matching). If the spelling similarity is $\ge 38\%$, the engine accepts the move with a gentle note:
> *💡 Auto-corrected from 'Indonasia' to 'Indonesia' 🇮🇩*

The game keeps flowing, confidence stays high, and the child learns the right spelling naturally.

### 3. 🎯 The "Springfield" Duplicate Fix
There are over 30 cities named *Springfield* in the United States alone, and multiple places named *Santiago*. 
Instead of interrupting an 8-year-old with a confusing 30-item disambiguation dropdown, our database automatically selects the highest-tier version (e.g. Santiago, Capital of Chile) and drops the pin there immediately.

### 4. 🧭 Kid-First Comprehension Pacing
Raw database queries take 40 milliseconds. If the AI responded that quickly, the screen would instantly snap away before the child even registered where their pin landed.

Atlas Kids introduces a deliberate 1.5–3 second pacing rhythm:
1. Your pin drops on your place $\rightarrow$ camera glides to your city.
2. A brief pause lets your eyes register the continent.
3. Atlas AI says *"Atlas is searching the archives..."* $\rightarrow$ glides across the globe to the AI's destination!

### 5. ✈️ The "Flight Path Journey" Replay
When a game finishes (or when the child clicks **Finish & See Recap**), the app shifts into **Journey Mode**. 
A glowing flight path connects every single location visited, and the camera flies from continent to continent, spending 1.5 seconds at each stop to recap the entire adventure!

### 6. 📖 1-Click Wikipedia Cards
Clicking any pin on the map opens a place card with its type, parent country, and a clean **`📖 Learn on Wiki ↗`** button that opens the encyclopedia in a new tab.
*(Built using deterministic client-side URL generation—adding 0 bytes of extra storage to the database!)*

---

## 🛠️ The Tech Stack

```
[ Frontend (Browser) ]
  Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
  Interactive Map: Leaflet.js with 100% Free OpenStreetMap raster tiles
       │
       │  POST /api/game/turn (Serverless Route Handler)
       ▼
[ Cloud Database ]
  Neon Serverless PostgreSQL 18.6 (AWS US-East-1)
  ├── 157,943 places (Countries, Capitals, States, Cities)
  ├── B-Tree Index on (first_letter, tier) -> sub-2ms queries
  ├── Trigram GIN index for fuzzy typo correction (pg_trgm)
  └── PgBouncer Connection Pooling -> handles 3,000+ simultaneous players for $0
```

---

## 📂 Project Architecture

```
atlas-kids/
├── data/                    # Raw geographical dataset (53MB JSON)
├── scripts/                 # Python inspection & ETL tools
│   ├── inspect_data.py      # Read-only audit & A-Z frequency matrix
│   ├── import_places.py     # 4-Tier batch ingestion pipeline into Neon
│   └── play_cli.py          # Terminal playtester to test the game engine
├── backend/
│   └── game_engine.py       # Pure Python reference engine
├── src/
│   ├── app/
│   │   ├── page.tsx         # Main responsive UI (Desktop 40/60 split, Mobile tabs)
│   │   ├── layout.tsx       # Metadata & fonts
│   │   ├── globals.css      # Field-journal styling & Leaflet overrides
│   │   └── api/
│   │       ├── game/turn/   # Serverless turn validator & 4-tier AI selector
│   │       ├── health/      # Neon DB connectivity & pg_trgm verification
│   │       └── analytics/   # Anonymous player telemetry summary
│   ├── components/
│   │   ├── MapComponent.tsx # Interactive Leaflet map (flight path, popups, fading)
│   │   ├── TurnPrompt.tsx   # Compass badge & active letter prompt
│   │   ├── PlaceInput.tsx   # High-contrast, kid-friendly accessible input
│   │   ├── TurnHistory.tsx  # Scrollable field journal entry cards
│   │   ├── ScorePanel.tsx   # Supportive stats (Places logged, countries visited)
│   │   ├── CorrectionCard.tsx # Gentle typo banners
│   │   ├── ForfeitDialog.tsx# Confirmation modal before ending round
│   │   └── GameSummary.tsx  # Expedition debrief, share action & journey replay
│   ├── lib/
│   │   └── db.ts            # Neon serverless database connection client
│   └── types/
│       └── game.ts          # Shared TypeScript models (PlaceView, UIPhase)
└── .env.local               # Secret database connection string (kept locally)
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** (v18 or newer)
- **Python** (v3.10 or newer)
- A free **[Neon](https://neon.tech)** PostgreSQL database

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/SarvagyeTalwar/Atlas-Game.git
cd Atlas-Game

# Install Node dependencies
npm install
```

### 3. Configure Database
Create a `.env.local` file in the root folder with your Neon connection string:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.neon.tech/neondb?sslmode=require"
```

### 4. Ingest the Places Data
Run the high-speed Python ingestion pipeline (takes ~30 seconds to parse and batch-insert 158,000 places):
```bash
python scripts/import_places.py
```

### 5. Launch the Web App
```bash
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)** and start charting the globe!

---

## 🔒 Privacy & Safety (COPPA & GDPR-K)

Because Atlas Kids is built for children:
- **No accounts or passwords required.**
- **No personal information collected** (no names, emails, device IDs, or exact GPS coordinates).
- All active game progress is stored locally in the child's own browser (`localStorage`).
- Server telemetry only captures anonymous aggregate country codes (e.g. *"A move was played from India"*) to observe global popularity safely.

---

## 📜 Dataset Attribution

Geographical data is powered by the open-source [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database) by [dr5hn](https://github.com/dr5hn), licensed under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/).

---

*Made with ❤️ for young navigators everywhere.*
