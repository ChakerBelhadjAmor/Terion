# Terion — Plan de Charge · Laboratoires Teriak

A desktop-first production load planning application for **Laboratoires Teriak**. It lets production planners upload a PDP (Plan Directeur de Production) Excel file and instantly visualise the load vs. capacity across all 10 manufacturing workshops, run simulations, and query an AI assistant — all without an internet connection.

**Terion** is packaged as a native desktop app (Electron) that automatically starts the full Docker stack on launch.

---

## Table of Contents

- [What the App Does](#what-the-app-does)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Running the App](#running-the-app)
- [Excel File Format](#excel-file-format)

---

## What the App Does

Pharmaceutical manufacturing at Teriak involves routing drug lots through up to 10 sequential workshops (ateliers A through J). The planner's challenge is ensuring that no workshop is overloaded during a given production horizon.

This app solves that problem across four views:

### Landing Page
A large drag-and-drop zone. The planner drops their PDP Excel file and the app immediately parses it and navigates to the dashboard. A "demo data" button lets anyone explore the app instantly without a file.

### Dashboard
- **Factory Health Score** — a top-level indicator (Optimal / Attention / Critique) that summarises whether the factory is within capacity.
- **Capacity vs. Load bar chart** — one bar per atelier, color-coded: teal = nominal, amber = near capacity (≥ 80%), red = overloaded (> 100%).
- **Heatmap grid** — 10 atelier tiles that glow amber when near saturation, making bottlenecks visible at a glance.
- **Interactive Gantt chart** — shows which products are scheduled in which ateliers per week. Hovering any block highlights that product's entire manufacturing path (gamme) across all ateliers.

### Simulation
Five sliders control the capacity formula in real time:

```
Available Hours = Weeks × Days/Week × Shifts/Day × Hours/Shift × Efficiency%
```

Every slider adjustment instantly recalculates and redraws the capacity line on the chart and updates the per-atelier utilisation table, so planners can answer "what if we add a third shift?" without touching a spreadsheet.

### Base Produits (Product Database)
A searchable list of all products in the PDP with their DCI, pharmaceutical form, lot count, and gamme. Clicking a product opens a detail panel showing the full manufacturing path with the processing time per lot per atelier.

### Settings
Configure the backend URL, Ollama endpoint, LLM model selection, and feature toggles (offline mode, auto-optimise, debug mode).

### AI Assistant
A floating chat button (bottom-right). When opened it greets the planner with a natural-language summary of the current situation:

> *"Bonjour. J'ai analysé le PDP. L'atelier C est actuellement à 112% de capacité. Souhaitez-vous voir mes suggestions ?"*

The assistant answers questions about capacity, bottlenecks, and optimisation strategies. It calls the Spring Boot backend which proxies to a local Ollama instance running Llama 3. If Ollama is unavailable it falls back to intelligent hard-coded responses, so the assistant always works.

---

## Technologies

###  Desktop
| Technology | Role |
|---|---|
| ![Electron](https://img.shields.io/badge/Electron_33-47848F?style=flat-square&logo=electron&logoColor=white) **Electron 33** | Native desktop wrapper (Windows / macOS / Linux) |
| ![electron-builder](https://img.shields.io/badge/electron--builder_25-47848F?style=flat-square&logo=electron&logoColor=white) **electron-builder 25** | Cross-platform installer packaging (AppImage, deb, NSIS, dmg) |

###  Frontend
| Technology | Role |
|---|---|
| ![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB) **React 18** | UI component framework |
| ![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white) **Vite 5** | Dev server and production bundler |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) **Tailwind CSS 3** | Utility-first styling with custom Teriak theme |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white) **Framer Motion** | Page transitions, animated bar fills, hover effects |
| ![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik00IDIwaDJWOEg0em0zLTZoMnYtNkg3em0zIDNoMlY1aC0yem0zIDNoMlY5aC0yem0zLTZoMnY0aC0yeiIvPjwvc3ZnPg==&logoColor=white) **Recharts** | Bar charts and reference lines |
| ![React Router](https://img.shields.io/badge/React_Router_6-CA4245?style=flat-square&logo=react-router&logoColor=white) **React Router 6** | Client-side routing (Landing, Dashboard, Simulation, Products, Settings) |
| ![react-dropzone](https://img.shields.io/badge/react--dropzone-61DAFB?style=flat-square&logo=react&logoColor=black) **react-dropzone** | Drag-and-drop file upload zone |
| ![SheetJS](https://img.shields.io/badge/xlsx_(SheetJS)-217346?style=flat-square&logo=microsoftexcel&logoColor=white) **xlsx (SheetJS)** | Excel parsing in the browser |
| ![lucide-react](https://img.shields.io/badge/lucide--react-F56565?style=flat-square&logo=lucide&logoColor=white) **lucide-react** | Icon set |

###  Backend
| Technology | Role |
|---|---|
| ![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.2-6DB33F?style=flat-square&logo=springboot&logoColor=white) **Spring Boot 3.2** | REST API framework |
| ![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat-square&logo=openjdk&logoColor=white) **Java 21** | Runtime (virtual threads ready) |
| ![Apache POI](https://img.shields.io/badge/Apache_POI-D22128?style=flat-square&logo=apache&logoColor=white) **Apache POI** | Server-side Excel parsing |
| ![Ollama](https://img.shields.io/badge/Ollama-000000?style=flat-square&logo=ollama&logoColor=white) **Ollama** | Local LLM runtime (no cloud required) |
| ![Llama 3](https://img.shields.io/badge/Llama_3-7C3AED?style=flat-square&logo=meta&logoColor=white) **Llama 3** | The language model served by Ollama |
| ![Timefold](https://img.shields.io/badge/Timefold_Solver_1.11-FF6B35?style=flat-square&logoColor=white) **Timefold (OptaPlanner)** | Constraint solver for lot re-sequencing optimisation |
| ![Lombok](https://img.shields.io/badge/Lombok-BC4520?style=flat-square&logo=java&logoColor=white) **Lombok** | Boilerplate reduction |

###  Infrastructure
| Technology | Role |
|---|---|
| ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) **Docker** | Container packaging for backend and frontend |
| ![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white) **Docker Compose** | Orchestrates Ollama + backend + frontend as one stack |
| ![nginx](https://img.shields.io/badge/nginx-009639?style=flat-square&logo=nginx&logoColor=white) **nginx** | Serves the React build and proxies `/api` calls to the backend |

---

## Project Structure

```
Terion/
├── docker-compose.yml          # Full-stack orchestration (Ollama + backend + frontend)
│
├── desktop/                    # Electron native desktop wrapper
│   ├── main.js                 # App entry: starts Docker stack, shows splash, loads React UI
│   └── package.json            # Electron + electron-builder config (AppImage / deb / NSIS / dmg)
│
├── frontend/
│   ├── Dockerfile              # nginx-based production image
│   ├── nginx.conf              # SPA routing + /api reverse proxy
│   ├── src/
│   │   ├── App.jsx             # Router root
│   │   ├── context/
│   │   │   └── AppContext.jsx  # Global state (products, params, health)
│   │   ├── data/
│   │   │   └── mockData.js     # 8 demo products, capacity formulas, Gantt generator
│   │   ├── utils/
│   │   │   └── excelParser.js  # Browser-side XLSX → product array
│   │   ├── components/
│   │   │   ├── Layout/         # Sidebar + Layout wrapper
│   │   │   ├── DropZone/       # Drag-and-drop upload component
│   │   │   └── AIAssistant/    # Floating chat panel
│   │   └── pages/
│   │       ├── LandingPage.jsx
│   │       ├── Dashboard.jsx   # HealthScore + CapacityChart + Heatmap + Gantt
│   │       ├── Simulation.jsx  # Live sliders + real-time chart
│   │       ├── ProductDatabase.jsx
│   │       └── Settings.jsx
│
└── backend/
    ├── Dockerfile
    └── src/main/java/com/teriak/
        ├── TeriakApplication.java
        ├── config/CorsConfig.java
        ├── controller/
        │   ├── PdpController.java   # /api/pdp/upload, /api/pdp/capacity
        │   └── AiController.java    # /api/ai/chat
        ├── service/
        │   ├── ExcelParserService.java
        │   ├── CapacityService.java
        │   └── AiAssistantService.java
        └── model/
            └── ProductionPlan.java
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (React)                          │
│                                                                 │
│  1. User drops PDP.xlsx onto DropZone                           │
│       │                                                         │
│       ▼                                                         │
│  2. excelParser.js reads the file client-side (SheetJS)         │
│     Extracts: product name, DCI, lots, gamme, processing times  │
│       │                                                         │
│       ▼                                                         │
│  3. AppContext stores products + default params                  │
│     Derives: loads per atelier, utilisation %, health score      │
│       │                                                         │
│       ▼                                                         │
│  4. Dashboard renders:                                          │
│     • HealthScore  ← derived in AppContext                      │
│     • CapacityChart ← Recharts bar chart, color per utilisation │
│     • HeatmapGrid  ← 10 tiles, glows amber if ≥ 80%            │
│     • GanttChart   ← per-atelier per-week grid, hover = gamme  │
│       │                                                         │
│  5. Simulation sliders mutate params in AppContext              │
│     → capacity formula re-runs → all charts update instantly    │
│       │                                                         │
│  6. AI Assistant button clicked                                 │
│       │                                                         │
│       ▼                                                         │
│  POST /api/ai/chat  { message, context: { overloaded, params } }│
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (dev: Vite proxy / prod: nginx)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Spring Boot Backend (:8080)                    │
│                                                                 │
│  AiController → AiAssistantService                             │
│       │                                                         │
│       ▼                                                         │
│  Builds system prompt with capacity context                     │
│  POST http://ollama:11434/api/generate                          │
│       │                                                         │
│       ▼                                                         │
┌───────────────────┐                                             │
│  Ollama (:11434)  │  ← Llama 3 model from local Docker volume  │
│  (no internet)    │                                             │
└───────────────────┘                                             │
│       │                                                         │
│       ▼                                                         │
│  Returns natural-language answer → browser → chat panel        │
└─────────────────────────────────────────────────────────────────┘

Optional server-side Excel upload flow:
  Browser → POST /api/pdp/upload (multipart) → ExcelParserService (Apache POI)
  → CapacityService → JSON response → AppContext update
```

### Capacity Formula

```
Available Hours (per atelier) =
    Weeks  ×  Days/Week  ×  Shifts/Day  ×  Hours/Shift  ×  (Efficiency / 100)

Load (per atelier) =
    Σ (lots_i × processing_time_i_per_atelier)   for all products i passing through that atelier

Utilisation % = (Load / Available Hours) × 100
```

---

## Running the App

### Option A — Desktop app (Electron, recommended for end-users)

**Prerequisites:** Docker and Docker Compose installed. Node.js 18+ for building.

```bash
cd desktop
npm install
npm start        # launches Electron, starts Docker stack automatically
```

On launch, Terion shows a splash screen while it starts the Docker stack in the background, then loads the React UI inside an Electron window. No browser needed.

To build a distributable installer:

```bash
npm run dist:linux   # AppImage + .deb
npm run dist:win     # NSIS installer (.exe)
npm run dist:mac     # .dmg
```

---

### Option B — Frontend only (fastest, no Docker needed)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The app runs fully with demo data. The AI assistant falls back to intelligent local responses when the backend is absent.

---

### Option C — Full stack with Docker Compose

**Prerequisites:** Docker and Docker Compose installed.

```bash
# From the project root
docker-compose up --build
```

This starts three services:

| Service | Port | Description |
|---|---|---|
| `ollama` | 11434 | Local LLM runtime |
| `backend` | 8080 | Spring Boot REST API |
| `frontend` | 3000 | React app served by nginx |

On first run, Ollama will automatically pull the **Llama 3** model (~4 GB). Subsequent starts use the cached model from the `teriak_ollama_models` Docker volume — no internet required after that.

Open `http://localhost:3000`.

**Stopping:**
```bash
docker-compose down
```

**Stopping and removing the model volume** (forces re-download next time):
```bash
docker-compose down -v
```

---

### Option D — Backend only (Spring Boot)

Requires Java 21 and Maven (or use the included `mvnw` wrapper).

```bash
cd backend
./mvnw spring-boot:run
```

The backend starts on port `8080`. Point the frontend dev server at it via the Vite proxy (already configured in `vite.config.js`).

---

## Excel File Format

The app accepts `.xlsx` or `.xls` files. The first sheet must have a header row with these columns (case-insensitive):

| Column | Required | Description |
|---|---|---|
| `PRODUIT` | Yes | Product name |
| `DCI` | No | International non-proprietary name |
| `FORME` | No | Pharmaceutical form |
| `LOTS` | Yes | Number of lots in the PDP |
| `A` through `J` | At least one | Processing time in hours per lot for that atelier |

Ateliers not used by a product should be left blank or set to 0.

**Example:**

| PRODUIT | DCI | FORME | LOTS | A | B | C | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|---|
| Lotentin 100mg | Amlodipine | Comprimé pelliculé | 8 | 6 | 4 | 8 | 3 | 3 | 10 | 2 |
| Respirex Injectable | Salbutamol | Solution injectable | 10 | | | | 4 | 4 | 14 | 2 |

Columns for ateliers not listed (e.g. `D`, `E`, `F`) are simply ignored for products that don't pass through them.
