#!/bin/sh
set -e

python - <<'PY'
import os
import time
from urllib.parse import urlparse, urlunparse

from sqlalchemy import create_engine, text

database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise SystemExit("DATABASE_URL is not set")

parsed_database_url = urlparse(database_url)
postgres_host = os.environ.get("KWIKMENU_POSTGRES_HOST")
if postgres_host and parsed_database_url.hostname in {"postgres", None}:
    netloc = postgres_host
    if parsed_database_url.username:
        netloc = parsed_database_url.username
        if parsed_database_url.password:
            netloc += f":{parsed_database_url.password}"
        netloc += f"@{postgres_host}"
    if parsed_database_url.port:
        netloc += f":{parsed_database_url.port}"
    database_url = urlunparse(parsed_database_url._replace(netloc=netloc))
    os.environ["DATABASE_URL"] = database_url
    parsed_database_url = urlparse(database_url)

print(
    f"Waiting for database host={parsed_database_url.hostname} port={parsed_database_url.port or 5432}",
    flush=True,
)

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
