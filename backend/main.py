"""API de Info Alicante: plazas libres en los parkings del centro de Alicante."""
import asyncio
import logging
import time
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from catalog import PARKINGS
from sources import READERS

CACHE_SECONDS = 60
logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Info Alicante API", docs_url=None, redoc_url=None)
# Datos públicos de solo lectura: cualquier origen puede leerlos.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"])

_cache: dict = {"at": 0.0, "data": None}
_lock = asyncio.Lock()


async def _read(client: httpx.AsyncClient, parking: dict) -> dict:
    out = {k: parking.get(k) for k in ("id", "name", "operator", "address")}
    out.update(live=False, free=None, capacity=None)
    reader = READERS.get(parking.get("source"))
    if not reader:
        return out
    try:
        out.update(await reader(client, parking), live=True)
    except Exception as exc:  # una fuente caída no tumba al resto
        logger.warning("parking %s sin dato: %s", parking["id"], exc)
    return out


async def _collect() -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        rows = await asyncio.gather(*(_read(client, p) for p in PARKINGS))
    return {"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "parkings": rows}


@app.get("/parkings")
async def parkings():
    async with _lock:
        if _cache["data"] is None or time.monotonic() - _cache["at"] > CACHE_SECONDS:
            _cache["data"] = await _collect()
            _cache["at"] = time.monotonic()
    return _cache["data"]


@app.get("/health")
async def health():
    return {"ok": True}
