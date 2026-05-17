# Backend

FastAPI service for menu import jobs.

## Endpoints

- `POST /api/menu-imports`
- `GET /api/menu-imports/{job_id}`
- `GET /health`

## Run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Notes

- Uploaded files are stored in `backend/.data/uploads`.
- Menu imports are queued through Redis and processed by a separate Celery worker.
- If `OPENROUTER_API_KEY` is not configured, the parser finishes in fallback mode and still returns a schema-valid menu JSON scaffold.

## Docker

The repo-level `docker-compose.yml` starts this backend automatically.

Prepare env:

```bash
cp backend/.env.example backend/.env
```

Required:

```env
OPENROUTER_API_KEY=...
```
