"""Lectores de plazas libres en vivo, uno por fuente.

Cada lector recibe la entrada del catálogo y devuelve {"free": int, "capacity": int}
o lanza una excepción si no hay dato.
"""
import re

import httpx

HEADERS = {"User-Agent": "Mozilla/5.0 (info-alicante; +https://wandering-code.github.io/info-alicante/)"}

_SABA_RE = re.compile(
    r'available-places">\s*Plazas:\s*<strong>\s*(\d+)\s*</strong>.*?Plazas Disponibles:\s*<strong>\s*(\d+)\s*</strong>',
    re.S,
)


async def saba(client: httpx.AsyncClient, parking: dict) -> dict:
    """La ficha de cada parking en saba.es lleva el contador en el HTML."""
    res = await client.get(parking["source_url"], headers=HEADERS, follow_redirects=True)
    res.raise_for_status()
    m = _SABA_RE.search(res.text)
    if not m:
        raise ValueError("saba: contador no encontrado en la página")
    capacity, free = int(m.group(1)), int(m.group(2))
    if capacity <= 0 or free > capacity:
        raise ValueError(f"saba: dato incoherente ({free}/{capacity})")
    return {"free": free, "capacity": capacity}


READERS = {
    "saba": saba,
}
