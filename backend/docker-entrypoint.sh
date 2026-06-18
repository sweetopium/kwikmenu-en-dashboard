#!/bin/sh
set -e

python - <<'PY'
import os
import time

from sqlalchemy import create_engine, text

database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise SystemExit("DATABASE_URL is not set")

last_error = None
for attempt in range(1, 31):
    try:
        engine = create_engine(database_url, pool_pre_ping=True)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Database is ready", flush=True)
        break
    except Exception as exc:
        last_error = exc
        print(f"Waiting for database ({attempt}/30): {exc}", flush=True)
        time.sleep(2)
else:
    raise SystemExit(f"Database is not ready: {last_error}")
PY

exec "$@"
