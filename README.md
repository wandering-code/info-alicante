# Info Alicante

Información útil de Alicante y San Vicente del Raspeig en una sola web.

**En producción:** https://wandering-code.github.io/info-alicante/

## Vistas

- **Farmacias de guardia**: las que están de guardia ahora mismo en Alicante y en San Vicente, con
  dirección, enlace a Google Maps y plano de ubicación.
- **Parkings del centro**: plazas libres en tiempo real en los parkings de Alicante centro que
  publican su ocupación, y la lista del resto de parkings de la zona.

## Cómo funciona

Es una web estática (HTML, CSS y JS sin build ni dependencias), publicada con GitHub Pages desde
la rama `main`.

Los datos de farmacias se piden en vivo desde el navegador a la API pública del Colegio Oficial de
Farmacéuticos de Alicante, la misma que usa
[cofalicante.com/farmacias-de-guardia](https://cofalicante.com/farmacias-de-guardia/):

```
GET https://cofalicante.com/wp-json/wp-cofa/v2/pharmacies?d=YYYY-MM-DD&l=<código>
```

Códigos de localidad: `13` Alicante, `55` San Vicente del Raspeig (lista completa en
`/wp-json/wp-cofa/v2/locations`). La API mezcla la guardia de ayer (`state: closed`) con la de hoy,
así que la web muestra solo las que no están cerradas. Si la API falla, se muestran los últimos
datos guardados en el navegador, con un aviso.

## Parkings: backend en el mini PC

Ningún operador de parkings deja leer sus datos desde el navegador, así que hay un backend mínimo
(FastAPI, sin BBDD) en el mini PC que los reúne y los sirve con caché de 60 s:

- `GET https://info-alicante.wanderingcode.dev/api/parkings`
- Catálogo de parkings: `backend/catalog.py`. Lectores de cada fuente: `backend/sources.py`
  (para añadir una fuente: escribir su lector, registrarlo en `READERS` y poner `source` en el
  catálogo).
- Fuentes en vivo hoy: Saba Maisonnave (contador de saba.es). Los 7 parkings de concesión
  municipal salen en movilidad.alicante.es, pendiente de integrar.

Despliegue (nginx 3013 → backend 8006, ver tabla de puertos de dev-standards):

```bash
ssh minipc
cd /home/wander/apps/info-alicante && git pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

nginx (`/etc/nginx/sites-enabled/info-alicante`) sirve `/api/` hacia el backend y además una
copia del frontend en https://info-alicante.wanderingcode.dev.

## Desarrollo local

```bash
python -m http.server 5500 --bind 0.0.0.0   # frontend → http://<ip-lan>:5500
docker compose up --build                   # backend  → http://<ip-lan>:8006
```

En local el frontend usa automáticamente el backend en `http://<ip-lan>:8006`.

## Añadir una vista nueva

1. Crear `js/views/<vista>.js` que exporte `{ id, title, render(container) }`. `render` puede
   devolver una función de limpieza.
2. Importarla y añadirla al array `VIEWS` de `js/app.js`. Aparece sola en la navegación
   (`#/<id>`).
