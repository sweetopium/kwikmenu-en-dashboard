# kwikmenu-dashboard

Frontend on Vite/React and backend on FastAPI for menu import and normalization.

## Local dev

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8000` by default.

## Docker deploy

1. Prepare backend env:

```bash
cp backend/.env.example backend/.env
```

2. Fill `backend/.env` with at least:

```env
OPENROUTER_API_KEY=...
```

3. Build and start:

```bash
docker compose up --build -d
```

4. Open:

```text
http://YOUR_SERVER_IP/
```

What runs:
- `frontend` serves the built Vite app via nginx on port `80`
- `frontend` proxies `/api/*` to `backend`
- `backend` stores uploads in a Docker volume mounted to `/app/.data`

Stop:

```bash
docker compose down
```

Stop and remove uploaded data volume:

```bash
docker compose down -v
```
