import { getParkings } from '../api/parkings.js';

const REFRESH_MS = 60_000;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'style') node.style.cssText = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(c));
  }
  return node;
}

const ICON_ROUTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>';
const ICON_REFRESH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';

function mapsUrl(p) {
  const q = `Parking ${p.name}, ${p.address}, Alicante`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function level(free, capacity) {
  const occ = 1 - free / capacity;
  if (free === 0) return { tone: 'full', label: 'Completo' };
  if (occ >= 0.9) return { tone: 'red', label: 'Casi lleno' };
  if (occ >= 0.7) return { tone: 'amber', label: 'Bastante ocupado' };
  return { tone: 'green', label: 'Con sitio' };
}

function liveCard(p) {
  const lv = level(p.free, p.capacity);
  const occPct = Math.round((1 - p.free / p.capacity) * 100);
  return el('article', { class: `card park park--${lv.tone}` },
    el('div', { class: 'park-top' },
      el('div', { class: 'park-heading' },
        el('p', { class: 'park-level' }, el('span', { class: 'dot' }), lv.label),
        el('h2', {}, p.name),
        el('p', { class: 'park-addr' }, [p.address, p.operator].filter(Boolean).join(' · ')),
      ),
      el('div', { class: 'park-free' },
        el('strong', {}, String(p.free)),
        el('span', {}, p.free === 1 ? 'plaza libre' : 'plazas libres'),
      ),
    ),
    el('div', { class: 'bar', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(occPct), 'aria-label': `Ocupación ${occPct}%` },
      el('span', { style: `width:${occPct}%` }),
    ),
    el('div', { class: 'park-foot' },
      el('span', { class: 'muted' }, `${occPct}% ocupado · ${p.capacity} plazas`),
      el('a', { class: 'link-btn', href: mapsUrl(p), target: '_blank', rel: 'noopener' },
        el('span', { class: 'icon', html: ICON_ROUTE }), 'Cómo llegar'),
    ),
  );
}

function otherRow(p) {
  return el('li', {},
    el('a', { href: mapsUrl(p), target: '_blank', rel: 'noopener' },
      el('span', { class: 'other-name' }, p.name),
      el('span', { class: 'muted' }, p.address),
    ),
  );
}

export default {
  id: 'parkings',
  title: 'Parkings',

  render(container) {
    let requestId = 0;
    let timer = null;

    const refreshBtn = el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Actualizar', title: 'Actualizar', html: ICON_REFRESH });
    const summary = el('div', { class: 'park-summary', 'aria-live': 'polite' });
    const meta = el('p', { class: 'meta' });
    const list = el('div', { class: 'list' });
    const others = el('section', { class: 'others', hidden: true });

    container.append(
      el('section', { class: 'hero' },
        el('p', { class: 'eyebrow' }, 'Alicante centro · en tiempo real'),
        el('h1', {}, 'Parkings del centro'),
        el('p', { class: 'lede' }, 'Plazas libres ahora mismo en los aparcamientos públicos de la zona centro.'),
      ),
      el('div', { class: 'toolbar' }, summary, refreshBtn),
      meta,
      list,
      others,
    );

    function render(data) {
      const live = data.parkings.filter(p => p.live && p.capacity > 0).sort((a, b) => b.free - a.free);
      const rest = data.parkings.filter(p => !(p.live && p.capacity > 0));
      const totalFree = live.reduce((s, p) => s + p.free, 0);

      summary.replaceChildren(
        el('strong', {}, totalFree.toLocaleString('es-ES')),
        el('span', {}, ` plazas libres en ${live.length} ${live.length === 1 ? 'parking' : 'parkings'} con dato en vivo`),
      );
      const t = new Date(data.updated_at);
      meta.textContent = `Actualizado a las ${t.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })} · se refresca solo cada minuto`;
      meta.classList.remove('meta--warn');

      list.replaceChildren(...(live.length
        ? live.map(liveCard)
        : [el('div', { class: 'empty' }, el('p', {}, 'Ahora mismo ninguna fuente está dando datos en vivo.'))]));

      others.hidden = rest.length === 0;
      others.replaceChildren(
        el('h2', {}, 'Otros parkings del centro'),
        el('p', { class: 'muted' }, 'Sin datos de ocupación públicos por ahora. Toca uno para abrirlo en el mapa.'),
        el('ul', { class: 'other-list' }, rest.map(otherRow)),
      );
    }

    async function load({ silent = false } = {}) {
      const id = ++requestId;
      refreshBtn.classList.add('spinning');
      if (!silent) {
        meta.textContent = 'Cargando…';
        list.replaceChildren(...Array.from({ length: 2 }, () => el('div', { class: 'card skeleton', 'aria-hidden': 'true' })));
      }
      try {
        const data = await getParkings();
        if (id === requestId) render(data);
      } catch (err) {
        if (id !== requestId) return;
        console.error(err);
        meta.textContent = 'No se ha podido actualizar. Se reintentará en un minuto.';
        meta.classList.add('meta--warn');
        if (!silent) {
          list.replaceChildren(el('div', { class: 'empty empty--error' }, el('p', {}, 'No se ha podido conectar con el servidor de datos.')));
        }
      } finally {
        if (id === requestId) refreshBtn.classList.remove('spinning');
      }
    }

    function schedule() {
      clearInterval(timer);
      timer = setInterval(() => { if (document.visibilityState === 'visible') load({ silent: true }); }, REFRESH_MS);
    }
    const onVisible = () => { if (document.visibilityState === 'visible') load({ silent: true }); };

    refreshBtn.addEventListener('click', () => load({ silent: true }));
    document.addEventListener('visibilitychange', onVisible);
    load();
    schedule();

    return () => {
      requestId++;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  },
};
