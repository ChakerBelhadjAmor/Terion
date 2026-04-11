# Teriak — Plan de Charge

A desktop-first production load planning application for **Laboratoires Teriak**. It lets production planners upload a PDP (Plan Directeur de Production) Excel file and instantly visualise the load vs. capacity across all 10 manufacturing workshops, run simulations, and query an AI assistant — all without an internet connection.

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

### Frontend
| Technology | Role |
|---|---|
| **React 18** | UI component framework |
| **Vite 5** | Dev server and production bundler |
| **Tailwind CSS 3** | Utility-first styling with custom Teriak theme |
| **Framer Motion** | Page transitions, animated bar fills, hover effects |
| **Recharts** | Bar charts and reference lines |
| **React Router 6** | Client-side routing (Landing, Dashboard, Simulation, Products, Settings) |
| **react-dropzone** | Drag-and-drop file upload zone |
| **xlsx (SheetJS)** | Excel parsing in the browser |
| **lucide-react** | Icon set |

### Backend
| Technology | Role |
|---|---|
| **Spring Boot 3.2** | REST API framework |
| **Java 21** | Runtime (virtual threads ready) |
| **Apache POI** | Server-side Excel parsing |
| **LangChain4j** | LLM integration layer |
| **Ollama** | Local LLM runtime (no cloud required) |
| **Llama 3** | The language model served by Ollama |
| **Timefold (OptaPlanner)** | Constraint solver for lot re-sequencing optimisation |
| **Lombok** | Boilerplate reduction |

### Infrastructure
| Technology | Role |
|---|---|
| **Docker** | Container packaging for backend and frontend |
| **Docker Compose** | Orchestrates Ollama + backend + frontend as one stack |
| **nginx** | Serves the React build and proxies `/api` calls to the backend |

---

## Project Structure

```
teriak_hackathon/
├── docker-compose.yml          # Full-stack orchestration
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

### Option A — Frontend only (fastest, no Docker needed)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The app runs fully with demo data. The AI assistant falls back to intelligent local responses when the backend is absent.

---

### Option B — Full stack with Docker Compose

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

### Option C — Backend only (Spring Boot)

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
