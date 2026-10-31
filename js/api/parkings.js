// Cliente de la API propia (backend en el mini PC), que reúne las plazas libres
// de los parkings del centro de Alicante desde varias fuentes.

const PROD_API = 'https://info-alicante.wanderingcode.dev/api';

function apiBase() {
  const { hostname, protocol } = location;
  if (hostname === 'info-alicante.wanderingcode.dev') return '/api';
  // Desarrollo local (localhost o IP de la red): backend en el puerto 8006
  if (protocol === 'http:' && /^(localhost|127\.|192\.168\.|10\.)/.test(hostname)) {
    return `http://${hostname}:8006`;
  }
  return PROD_API;
}

export async function getParkings() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${apiBase()}/parkings`, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
