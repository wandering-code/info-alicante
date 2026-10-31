# Info Alicante

Información útil de Alicante y San Vicente del Raspeig en una sola web.

**En producción:** https://wandering-code.github.io/info-alicante/

## Vistas

- **Farmacias de guardia**: las que están de guardia ahora mismo en Alicante y en San Vicente, con
  dirección, enlace a Google Maps y plano de ubicación.

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

## Desarrollo local

```bash
python -m http.server 5500 --bind 0.0.0.0
# abrir http://<ip-lan>:5500
```

## Añadir una vista nueva

1. Crear `js/views/<vista>.js` que exporte `{ id, title, render(container) }`. `render` puede
   devolver una función de limpieza.
2. Importarla y añadirla al array `VIEWS` de `js/app.js`. Aparece sola en la navegación
   (`#/<id>`).
