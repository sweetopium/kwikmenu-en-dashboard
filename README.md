# kwikmenu-dashboard

Frontend on Vite/React and backend on FastAPI for menu import and normalization.

Menu imports are processed asynchronously via Celery + Redis. The API only creates a job and the worker processes it in the background.

## Magic demo

The seller demo is available at `/magic`. It uses `DEMO_MAGIC_TOKEN` on the backend; the frontend stores the token in localStorage and sends it as `X-Demo-Token`. Completed demo menus are public at `/tmp/:id`.

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
- `backend` serves API and stores uploads in a Docker volume mounted to `/app/.data`
- `worker` processes menu import jobs from Redis
- `redis` stores the job queue for Celery

Stop:

```bash
docker compose down
```

Stop and remove uploaded data volume:

```bash
docker compose down -v
```
