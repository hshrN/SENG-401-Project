# Setup Instructions

## Tech Stack

**Frontend:**
- React 19 (TypeScript), Create React App (`react-scripts`)
- React Router 7 (`HashRouter` for static hosting compatibility)
- Tailwind CSS, Framer Motion, TanStack Table, Lucide icons

**Backend:**
- Flask (Python web framework)
- Flask-SQLAlchemy (database ORM)
- Flask-Migrate (schema management)
- PostgreSQL (database)
- Argon2 (password hashing)
- Optional scenario generation: OpenAI and/or Google Gemini (`openai`, `google-genai` packages)

## Project Structure

```
SENG-401-Project/
├── backend/                         # Flask API (layered)
│   ├── app.py                       # Presentation: API routes only
│   ├── application/                 # Application: use cases (auth, session, scenario, round, AI)
│   ├── domain/                      # Domain: game rules, no I/O
│   ├── infrastructure/             # Package placeholder (optional extras)
│   ├── tests/                       # pytest: services, domain, AI (mocked)
│   ├── models.py                    # Infrastructure: DB models
│   ├── seed.py                      # Seeds test users and scenarios
│   ├── migrations/                  # Database schema versions (Flask-Migrate)
│   ├── venv/                        # Python virtual environment (don't commit)
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env                         # Local config (don't commit)
│   ├── railway.toml / Procfile      # Production process config
│   └── .gitignore
│
├── frontend/                        # React TypeScript app (layered)
│   ├── src/
│   │   ├── application/             # Application: auth, game, leaderboard services
│   │   ├── domain/                  # Domain: shared types
│   │   ├── infrastructure/api/      # HTTP client, auth/game/leaderboard API modules
│   │   ├── pages/                   # Presentation: Home, Game, Leaderboard, etc.
│   │   ├── components/              # UI (card, nav, tutorial, etc.)
│   │   ├── context/                 # Auth, audio
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── __tests__/               # Jest + React Testing Library
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
│
├── docs/
│   └── architecture.md              # Detailed layered architecture guide
│
├── .github/workflows/               # CI (e.g. itch.io deploy on frontend changes)
├── .gitignore
└── README.md
```

## Layered architecture

The codebase is split into four layers; **dependencies point inward** (outer layers call inner ones; domain and infrastructure do not depend on UI or routes).

Architecture guide:

- See `docs/architecture.md` for the full layered architecture overview, dependency rules, repo placement guidance, and contributor onboarding.

| Layer | Role | Lives in |
|-------|------|----------|
| **Presentation** | UI and API entry only: parse input, call application, return response. No business logic. | Backend: `app.py`. Frontend: `pages/`, `components/`, `context/`. |
| **Application** | Use cases and orchestration: auth, sessions, scenarios, rounds, optional AI scenario generation. Calls domain + infrastructure. | Backend: `application/`. Frontend: `application/`. |
| **Domain** | Core rules and types only. No Flask, SQLAlchemy, fetch, or I/O. | Backend: `domain/` (e.g. `game.py`). Frontend: `domain/` (e.g. `types.ts`). |
| **Infrastructure** | External I/O: DB (e.g. `models.py`), HTTP client (`infrastructure/api/`), password hashing. | Backend: `models.py`, infra in `app.py`. Frontend: `infrastructure/api/`. |

**Rule:** Presentation → Application → Domain; Application and Infrastructure both depend on Domain. UI and routes call the application layer only; they do not call the API client or DB directly.

## Prerequisites

Install these once on your machine:

### 1. Node.js (for frontend)
- **macOS:** `brew install node`
- **Ubuntu/Debian:** `sudo apt-get install nodejs npm`
- **Windows:** Download from https://nodejs.org/

Verify: `node --version && npm --version`

### 2. Python 3.12 (for backend)
Use Python 3.12 for the backend; newer versions (e.g. 3.14) may break `psycopg2-binary`.

- **macOS:** `brew install python@3.12`
- **Ubuntu/Debian:** `sudo apt-get install python3.12 python3.12-venv`
- **Windows:** Download from https://www.python.org/

Verify: `python3.12 --version`

### 3. PostgreSQL (for database)
- **macOS:** `brew install postgresql@15` or `postgresql@17`
- **Ubuntu/Debian:** `sudo apt-get install postgresql postgresql-contrib`
- **Windows:** Download from https://www.postgresql.org/download/windows/

After installing, start PostgreSQL:
- **macOS:** `brew services start postgresql@17` (or your version)
- **Ubuntu/Debian:** `sudo systemctl start postgresql`
- **Windows:** Usually starts automatically

Verify: `psql --version`

---

## Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/hshrN/SENG-401-Project.git
cd SENG-401-Project
```

### Step 2: Set Up the Database

Create the PostgreSQL database and a user that can connect. If your PostgreSQL requires a password, create a role and database as the superuser:

```bash
psql -U postgres -d postgres
```

In the `psql` prompt:

```sql
CREATE USER your_username WITH PASSWORD 'your_password' CREATEDB;
CREATE DATABASE "401GameDB";
GRANT ALL PRIVILEGES ON DATABASE "401GameDB" TO your_username;
\c 401GameDB
GRANT ALL ON SCHEMA public TO your_username;
GRANT CREATE ON SCHEMA public TO your_username;
\q
```

Replace `your_username` and `your_password` with the values you will use in `.env`. On PostgreSQL 15+, granting rights on schema `public` is required for non-owners to create tables.

If your setup uses trust auth and you already have a database, you can instead run:

```bash
createdb 401GameDB
```

### Step 3: Set Up the Backend

```bash
cd backend
```

Create a Python virtual environment with Python 3.12:

```bash
python3.12 -m venv venv
```

Activate the virtual environment:

- **macOS/Linux:** `source venv/bin/activate`
- **Windows:** `venv\Scripts\activate`

You should see `(venv)` at the start of your terminal prompt.

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Create the `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` so the app can connect. If PostgreSQL requires a username and password:

```
DATABASE_URL=postgresql://your_username:your_password@localhost/401GameDB
```

If no password is needed:

```
DATABASE_URL=postgresql://localhost/401GameDB
```

**Optional — AI scenario generation (`POST /api/scenarios/generate`):** add to `backend/.env` (never commit real keys). Set `AI_PROVIDER` to `openai` or `gemini`; the other provider is used as fallback if the primary call fails.

```
# Optional — leave unset to disable generation endpoints until keys exist
AI_PROVIDER=openai
OPENAI_KEY=your_openai_key
GEMINI_KEY=your_gemini_key
```

Initialize the database (creates all tables):

```bash
flask db upgrade
```

Seed test users and scenarios:

```bash
python seed.py
```

You should see messages that test accounts and scenarios were created. Verify tables if you like:

```bash
psql -U your_username -d 401GameDB -c "\dt"
```

You should see tables including `alembic_version`, `players`, `game_sessions`, `scenarios`, `game_rounds`.

### Step 4: Set Up the Frontend

From the project root:

```bash
cd frontend
npm install
```

---

## Running the Application

Use two terminal windows/tabs.

### Terminal 1: Backend

```bash
cd backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
python app.py
```

You should see the app running on http://127.0.0.1:5001 with debug mode on.

### Terminal 2: Frontend

```bash
cd frontend
npm start
```

The app opens at http://localhost:3000.

---

## Test Accounts

After running `python seed.py`, you can log in with these accounts:

| Username | Password |
|----------|----------|
| test     | test123  |
| demo     | demo123  |

Log in at http://localhost:3000/#/login before starting a game (the app uses **hash routing**).

---

## Verifying Everything Works

### 1. Backend health check

```bash
curl http://localhost:5001/api/health
```

Expected: `{"status":"ok"}`

### 2. Frontend

Visit http://localhost:3000. Log in with a test account, then open the game (e.g. `/#/game` after login). You should see scenarios and be able to make choices.

---

## Backend Overview

**app.py**
- Configures Flask, CORS, and the database from `DATABASE_URL` in `.env`.
- Routes: `GET /api/health`, `POST /api/login`, `POST /api/signup`, `POST /api/sessions`, `GET /api/scenarios/settings`, `GET /api/scenarios/next`, `POST /api/scenarios/generate`, `POST /api/rounds`, `GET /api/leaderboard`

**application/ai_service.py**
- Optional batch generation of new scenarios via OpenAI and/or Gemini; used by `POST /api/scenarios/generate`.

**models.py**
- **Player:** username, password_hash.
- **GameSession:** player, biosphere/society/economy metrics, status, final_score.
- **Scenario:** scenario text, two decisions (A/B) and their impacts on the three metrics.
- **GameRound:** records each choice in a session and the resulting metric values.

**seed.py**
- Creates test users (test/test123, demo/demo123) if they do not exist.
- Seeds the scenarios table with SDG-themed decision scenarios if it is empty.

---

## Making Changes to the Database Schema

1. Edit `models.py` (add or change columns/classes).
2. Run: `flask db migrate -m "Description of change"`
3. Run: `flask db upgrade`
4. Commit the new migration file.

---

## Run Tests

### Backend Tests

```bash
cd backend
pytest
```

To ignore warnings:

```bash
cd backend
pytest -p no:warnings
```

Tests live in `backend/tests/` (application services, domain logic, AI parsing with mocked providers).

### Frontend Tests

```bash
cd frontend
npm test
```

Tests live in `frontend/src/__tests__/` (Jest + React Testing Library).

---

## Troubleshooting

### "psycopg2 failed to build" on macOS
Use Python 3.12 for the backend venv. Create the venv with `python3.12 -m venv venv` and avoid Python 3.14 for this project.

### "fe_sendauth: no password supplied" or "password authentication failed"
Set `DATABASE_URL` in `backend/.env` with your PostgreSQL username and password, e.g.:

```
DATABASE_URL=postgresql://username:password@localhost/401GameDB
```

### "permission denied for schema public"
Your database user needs permission to create objects in `public`. As superuser (e.g. `psql -U postgres -d 401GameDB`):

```sql
GRANT ALL ON SCHEMA public TO your_username;
GRANT CREATE ON SCHEMA public TO your_username;
```

### "createdb: command not found"
PostgreSQL client tools are not in your PATH. Reinstall or add the bin directory to PATH (e.g. Homebrew: `postgresql@17/bin`).

### "Cannot connect to database"
Ensure PostgreSQL is running:
- **macOS:** `brew services list | grep postgresql`
- **Ubuntu/Debian:** `sudo systemctl status postgresql`

### "Port 3000 or 5001 already in use"
Stop the process using that port or run the app on a different port.

### "ModuleNotFoundError: No module named 'flask'"
Activate the virtual environment: `source venv/bin/activate` (or Windows equivalent).

### Login returns 401 or game fails with 404
- Use a test account (test/test123 or demo/demo123) and log in at `/#/login` before opening the game.
- Ensure the backend is running on port 5001 and the frontend is calling http://127.0.0.1:5001 for API requests (see `REACT_APP_API_URL` in `frontend/.env` if you override the default).

---

## Deployment

### Backend — Railway

**Live API:** `https://seng-401-project-production.up.railway.app`

#### Setup (first time only)

1. Go to: railway.app → **New Project** → **Deploy from GitHub repo**
2. Select: `hshrN/SENG-401-Project`
3. Service settings → **Root Directory**: `/backend`
4. Service settings → **Config File Path**: `/backend/railway.toml`
5. **+ New** → **Database** → **PostgreSQL** (auto-injects `DATABASE_URL`)
6. Service **Variables** tab — add:

| Variable | Value |
|---|---|
| `FLASK_ENV` | `production` |
| `FLASK_DEBUG` | `0` |

7. Click **Deploy** — Railway runs `flask db upgrade` then starts Gunicorn automatically
8. Once healthy: service **Settings → Networking → Generate Domain**
9. Test: `curl https://seng-401-project-production.up.railway.app/api/health` → `{"status":"ok"}`

#### Redeploying

Push to the connected branch — Railway redeploys automatically.

#### Teammates

Railway project → **Settings → Members → Invite** — collaborators are free.

---

### Frontend — itch.io

**Live game:** `https://wxyz7.itch.io/sdg-decision-game` (matches the GitHub Action that pushes `game.zip` with Butler)

If your team publishes under a different itch user or project slug, replace the URL above with yours.

#### CI deploy (optional)

On push to `main` with changes under `frontend/**`, `.github/workflows/deploy-frontend.yml` builds with `PUBLIC_URL=.` and `REACT_APP_API_URL` pointing at the Railway API, then deploys via [Butler](https://itch.io/docs/butler/) using the repository secret `BUTLER_API_KEY`.

#### First-time build and upload

```bash
# 1. Set the real Railway backend URL
echo "REACT_APP_API_URL=https://<railway-domain>.up.railway.app" > frontend/.env.production

# 2. Build with relative paths (required for itch.io subdirectory hosting)
cd frontend
PUBLIC_URL=. npm run build

# 3. Test locally before upload
npx serve -s build -p 4173
# open http://localhost:4173 — verify the app loads

# 4. Package (index.html must be at ZIP root)
cd build && zip -r ../game.zip . -x "*.DS_Store" && cd ..
```

#### itch.io project setup

1. Go to: itch.io/dashboard → **Create new project**
2. Set **Kind of project**: HTML
3. Upload `frontend/game.zip` — check **"This file will be played in the browser"**
4. **Viewport**: set to match game resolution (e.g. 1280×720)
5. Enable **Fullscreen button**
6. Set **Visibility** to Restricted or Draft for initial testing
7. Save — confirm the embed loads in browser

#### Rebuilding after a backend URL change

```bash
echo "REACT_APP_API_URL=https://<new-railway-domain>" > frontend/.env.production
cd frontend && PUBLIC_URL=. npm run build
cd build && zip -r ../game.zip . -x "*.DS_Store" && cd ..
# Re-upload game.zip to itch.io
```

#### Notes

- `PUBLIC_URL=.` makes all asset paths relative — required for itch.io iframe hosting
- `frontend/.env.production` is gitignored (no secrets, but URL belongs in env not repo)
- No code changes were needed — backend URL is injected at build time only
- CORS: backend runs `CORS(app)` open — no origin restrictions, no itch.io domain config needed

---

## Resources

- Flask: https://flask.palletsprojects.com/
- SQLAlchemy: https://docs.sqlalchemy.org/
- React: https://react.dev/
- PostgreSQL: https://www.postgresql.org/docs/
- Railway: https://railway.app
- Railway config reference: https://docs.railway.app/reference/config-as-code

---

## License

TBD
