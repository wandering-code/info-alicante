"""Parkings de la zona centro de Alicante.

`source` indica de dónde sale el dato en vivo (ver sources.py). Los que tienen
`source=None` se muestran sin plazas libres, solo con nombre y ubicación.
"""

PARKINGS = [
    # --- Con dato en vivo ---
    {
        "id": "saba-maisonnave",
        "name": "Saba Maisonnave",
        "operator": "Saba",
        "address": "C. Castellar 6, Av. Maisonnave",
        "source": "saba",
        "source_url": "https://www.saba.es/es/parking-alicante/parking-saba-maisonnave",
    },
    # --- Concesiones municipales (dato en vivo en movilidad.alicante.es, pendiente) ---
    {"id": "alfonso-el-sabio", "name": "Alfonso X el Sabio", "operator": "Pavapark",
     "address": "Av. Alfonso X el Sabio", "source": None},
    {"id": "la-montaneta", "name": "La Montañeta", "operator": "Parking Centro Alicante",
     "address": "Plaza de la Montañeta", "source": None},
    {"id": "san-cristobal", "name": "San Cristóbal", "operator": "Concesión municipal",
     "address": "Plaza de San Cristóbal", "source": None},
    {"id": "hermanos-lopez-osaba", "name": "Hermanos López de Osaba", "operator": "Concesión municipal",
     "address": "Mercado Central", "source": None},
    {"id": "catedratico-soler", "name": "Catedrático Soler", "operator": "Concesión municipal",
     "address": "Av. Catedrático Soler", "source": None},
    {"id": "avenida-estacion", "name": "Avenida de la Estación", "operator": "Concesión municipal",
     "address": "Av. de la Estación", "source": None},
    {"id": "plaza-america", "name": "Plaza de América", "operator": "Concesión municipal",
     "address": "Plaza de América", "source": None},
    # --- Privados sin dato en vivo público ---
    {"id": "corte-ingles-maisonnave", "name": "El Corte Inglés Maisonnave", "operator": "El Corte Inglés",
     "address": "Av. Maisonnave", "source": None},
    {"id": "corte-ingles-federico-soto", "name": "El Corte Inglés Federico Soto", "operator": "El Corte Inglés",
     "address": "Av. Federico Soto", "source": None},
    {"id": "canalejas", "name": "Canalejas", "operator": None, "address": "Plaza de Canalejas", "source": None},
    {"id": "puerto-alicante", "name": "Puerto de Alicante", "operator": "Interparking",
     "address": "Plaza Puerta del Mar", "source": None},
    {"id": "panoramis", "name": "Panoramis", "operator": None, "address": "Muelle de Levante", "source": None},
    {"id": "la-lonja", "name": "La Lonja", "operator": None, "address": "Av. de Loring", "source": None},
    {"id": "oscar-espla", "name": "Óscar Esplá", "operator": "Telpark", "address": "Av. Óscar Esplá", "source": None},
    {"id": "san-anton", "name": "San Antón", "operator": "Telpark", "address": "C. San Antón", "source": None},
    {"id": "poeta-quintana", "name": "Poeta Quintana", "operator": None, "address": "C. Poeta Quintana", "source": None},
    {"id": "gorrion", "name": "Gorrión", "operator": None, "address": "C. Gorrión", "source": None},
]
