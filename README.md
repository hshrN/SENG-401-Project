# Setup Instructions

## Tech Stack

**Frontend:**
- React 18 (TypeScript)

**Backend:**
- Flask (Python web framework)
- Flask-SQLAlchemy (database ORM)
- Flask-Migrate (schema management)
- PostgreSQL (database)

## Project Structure

```
sdg-game-project/
├── backend/                    # Flask API
│   ├── app.py                 # Flask app setup, routes, CORS
│   ├── models.py              # Database models (Player, GameSession, Card, Choice)
│   ├── migrations/            # Database schema versions (Flask-Migrate)
│   ├── venv/                  # Python virtual environment (don't commit)
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Template for environment variables
│   ├── .env                   # Local config (don't commit)
│   └── .gitignore
│
├── frontend/                   # React TypeScript app
│   ├── src/                   # React components
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── README.md              # Frontend-specific docs
│   └── .gitignore
│
├── .gitignore                 # Global Git rules
└── README.md                  # This file

```

## Prerequisites

Install these once on your machine:

### 1. Node.js (for frontend)
- **macOS:** `brew install node`
- **Ubuntu/Debian:** `sudo apt-get install nodejs npm`
- **Windows:** Download from https://nodejs.org/

Verify: `node --version && npm --version`

### 2. Python 3.12+ (for backend)
- **macOS:** `brew install python@3.12`
- **Ubuntu/Debian:** `sudo apt-get install python3.12 python3.12-venv`
- **Windows:** Download from https://www.python.org/

Verify: `python3.12 --version`

### 3. PostgreSQL (for database)
- **macOS:** `brew install postgresql@15`
- **Ubuntu/Debian:** `sudo apt-get install postgresql postgresql-contrib`
- **Windows:** Download from https://www.postgresql.org/download/windows/

After installing, start PostgreSQL:
- **macOS:** `brew services start postgresql@15`
- **Ubuntu/Debian:** `sudo systemctl start postgresql`
- **Windows:** Usually starts automatically

Verify: `psql --version`


### Step 1: Clone the Repository

```bash
git clone https://github.com/hshrN/SENG-401-Project.git
cd SENG-401-Project
```

### Step 2: Set Up the Database

Create the PostgreSQL database:

```bash
createdb 401GameDB
```

Verify it exists:

```bash
psql -l | grep 401GameDB
```

### Step 3: Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

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

Initialize the database (creates all tables):

```bash
flask db upgrade
```

Verify tables were created:

```bash
psql 401GameDB -c "\dt"
```

You should see 5 tables: `alembic_version`, `player`, `game_session`, `card`, `choice`.

### Step 4: Set Up the Frontend

Navigate to the frontend directory (from project root):

```bash
cd frontend
```

Install Node dependencies:

```bash
npm install
```

---

## Running the Application

You need **two terminal windows/tabs** to run both the backend and frontend simultaneously.

### Terminal 1: Start the Backend

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### Terminal 2: Start the Frontend

```bash
cd frontend
npm start
```

This opens http://localhost:3000 in your browser automatically.

---

## Verifying Everything Works

### 1. Test the Backend API

In another terminal:

```bash
curl http://localhost:5000/api/health
```

You should see: `{"status":"ok"}`

### 2. Check the Frontend

Visit http://localhost:3000 in your browser. You should see the React app load (even if it's empty).

Open browser developer tools (F12 → Console tab). There should be no errors.

---

## Understanding the Code

### Backend (Flask)

**app.py** - The entry point
- Initializes Flask app
- Configures PostgreSQL database connection
- Sets up CORS (allows frontend to call backend)
- Initializes Flask-Migrate (database version control)
- Imports and registers routes/endpoints

**models.py** - Database schema
- Defines 4 tables as Python classes:
  - `Player`: Stores user accounts
  - `GameSession`: One playthrough of the game (tracks biosphere, society, economy scores)
  - `Card`: A game scenario with two decision options
  - `Choice`: A player's decision on a card and its impact on metrics

Each `db.Column()` = one table column. Types like `db.Integer`, `db.String()`, `db.DateTime` define what kind of data goes there.

### Frontend (React)

See `frontend/README.md` for frontend-specific code documentation.

---

## Making Changes to the Database Schema

If you need to add columns or tables:

1. Edit `models.py` (add new columns or classes)
2. Run: `flask db migrate -m "Description of change"`
3. Run: `flask db upgrade`
4. Commit the new migration file to Git

Your teammates pull the changes and run `flask db upgrade` to sync their local database.

---

## Troubleshooting

### "psycopg2 failed to build" on macOS
Make sure you're using Python 3.12, not 3.13:
```bash
python3.12 --version
```

### "createdb: command not found"
PostgreSQL isn't in your PATH. Reinstall:
- **macOS:** `brew reinstall postgresql@15`

### "Cannot connect to database" error
Make sure PostgreSQL is running:
- **macOS:** `brew services list | grep postgresql`
- **Ubuntu/Debian:** `sudo systemctl status postgresql`

### "Port 3000 or 5000 already in use"
Something else is using that port. Either close it or run Flask/npm on different ports.

### "ModuleNotFoundError: No module named 'flask'"
Your virtual environment isn't activated. Run:
```bash
source venv/bin/activate
```

---

## Git Workflow

**Commit frequently with clear messages:**

```bash
git add .
git commit -m "Add card endpoints" 
git push
```

**Important:** Don't commit:
- `venv/` (Python packages)
- `node_modules/` (Node packages)
- `.env` (secrets)
- `*.db` (database files)

These are in `.gitignore` automatically.

---

## Team Collaboration

**Frontend team (Kai Christie, Ethan Klassen):**
- Work in the `frontend/` folder
- Build React components
- Call backend API endpoints

**Backend team (Hashir Naeem, Moyo Ogunjobi):**
- Work in the `backend/` folder
- Build Flask API endpoints
- Manage database schema

**DevOps team (Carl Soriano, Abenezer Erkalo):**
- Manage deployment
- Set up CI/CD pipelines
- Monitor infrastructure

**Communication:** When adding new API endpoints or database tables, notify the frontend team so they know what to call.

---

## Next Steps

1. **Backend:** Build API endpoints for creating players, starting games, getting cards, submitting choices
2. **Frontend:** Build card UI component, game state management, metrics display
3. **Integration:** Connect frontend to backend endpoints
4. **Testing:** Write tests for critical game logic
5. **Deployment:** Deploy to production (Heroku, AWS, etc.)

---

## Resources

- Flask docs: https://flask.palletsprojects.com/
- SQLAlchemy docs: https://docs.sqlalchemy.org/
- React docs: https://react.dev/
- PostgreSQL docs: https://www.postgresql.org/docs/

---

## License

TBD