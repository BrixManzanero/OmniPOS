import os
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

API_TITLE = "OmniPOS Zero API"
API_VERSION = "0.5.0"

DEFAULT_SQLITE_URL = (
    f"sqlite:///{(BACKEND_DIR / 'omnipos.db').as_posix()}"
)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    DEFAULT_SQLITE_URL,
)

DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173"
)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        DEFAULT_CORS_ORIGINS,
    ).split(",")
    if origin.strip()
]
