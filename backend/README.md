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

- Jobs are stored in memory.
- Uploaded files are stored in `backend/.data/uploads`.
- If `OPENROUTER_API_KEY` is not configured, the parser finishes in fallback mode and still returns a schema-valid menu JSON scaffold.
