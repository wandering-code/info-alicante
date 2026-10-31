// Cliente de la API pública de farmacias de guardia del Colegio Oficial de
// Farmacéuticos de Alicante (la misma que usa cofalicante.com/farmacias-de-guardia).
// La API devuelve cabeceras CORS para cualquier origen, así que se consulta
// directamente desde el navegador.

const API = 'https://cofalicante.com/wp-json/wp-cofa/v2/pharmacies';
const TIMEOUT_MS = 12000;

export const LOCALITIES = {
  alicante: { code: '13', label: 'Alicante', city: 'Alicante' },
  sanvicente: { code: '55', label: 'San Vicente', city: 'San Vicente del Raspeig' },
};

/** Fecha de hoy (YYYY-MM-DD) en hora de España, sea cual sea la zona del dispositivo. */
export function todayInSpain() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Farmacias de guardia ahora mismo en una localidad.
 * La API mezcla la guardia de ayer (ya cerrada) con la de hoy; nos quedamos
 * con las que no están cerradas, abiertas primero.
 */
export async function getOnDuty(localityKey) {
  const loc = LOCALITIES[localityKey];
  const url = `${API}?d=${todayInSpain()}&l=${loc.code}`;

  let json;
  try {
    json = await fetchJson(url);
  } catch {
    json = await fetchJson(url); // un reintento: la API a veces tarda en responder
  }

  const data = json?.data ?? {};
  const all = Array.isArray(data.pharmacies) ? data.pharmacies : [];
  const pharmacies = all
    .filter(p => String(p.state || '').toLowerCase() !== 'closed')
    .sort((a, b) => (b.state === 'opened') - (a.state === 'opened'));

  return { queriedAt: data.query_datetime || null, pharmacies };
}
