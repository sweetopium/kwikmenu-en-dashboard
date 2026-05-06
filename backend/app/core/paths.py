from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_ROOT = BACKEND_ROOT / ".data"
UPLOADS_ROOT = DATA_ROOT / "uploads"
