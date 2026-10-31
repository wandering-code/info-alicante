import { LOCALITIES, getOnDuty } from '../api/cofa.js';

const STORAGE_KEY = 'info-alicante:farmacias:localidad';
const CACHE_PREFIX = 'info-alicante:farmacias:cache:';
const LOWER_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'el']);

// ---------- helpers de texto ----------

function titleCase(str) {
  return String(str ?? '')
    .toLowerCase()
    .split(/(\s+|-|\/)/)
    .map((w, i) => (i > 0 && LOWER_WORDS.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/** "LOPEZ SANCHEZ, RAIMUNDA" → "Raimunda Lopez Sanchez" */
function formatName(raw) {
  const [surnames, name] = String(raw ?? '').split(',').map(s => s.trim());
  return titleCase(name ? `${name} ${surnames}` : surnames);
}

/** "C/ MAYOR, Nº29" → "C/ Mayor, 29" */
function formatAddress(raw) {
  const clean = String(raw ?? '').replace(/\bN(?:\.º|º|°)\s*(?=\d)/gi, '').trim();
  return titleCase(clean).replace(/\bC\//g, 'C/');
}

/** "11:26" → "11 h 26 min" */
function formatDuration(hhmm) {
  const m = String(hhmm ?? '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '';
  const h = Number(m[1]), min = Number(m[2]);
  if (h === 0) return `${min} min`;
  return min === 0 ? `${h} h` : `${h} h ${min} min`;
}

function statusInfo(p) {
  if (p.state === 'opened') {
    const day = p.open === 'yesterday' ? 'hoy' : 'mañana';
    const left = formatDuration(p.time_to_next_state);
    return {
      tone: 'open',
      label: 'De guardia ahora',
      detail: `Hasta ${day} a las ${p.until}${left ? ` · quedan ${left}` : ''}`,
    };
  }
  return {
    tone: 'soon',
    label: 'Guardia de hoy',
    detail: p.from ? `Empieza a las ${p.from}` : '',
  };
}

function mapsUrl(p, city) {
  const q = `${formatAddress(p.address)}, ${p.pc || ''} ${city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(c));
  }
  return node;
}

const ICONS = {
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  route: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
};

// ---------- render ----------

function pharmacyCard(p, city) {
  const status = statusInfo(p);
  const phone = String(p.phone || p.alternative_phone || '').trim();
  const img = p.image ? p.image.replace('://www.', '://') : null;

  return el('article', { class: `card card--${status.tone}` },
    el('div', { class: 'card-top' },
      el('span', { class: 'cross', 'aria-hidden': 'true' }),
      el('div', { class: 'card-heading' },
        el('p', { class: 'status' }, el('span', { class: 'dot' }), status.label),
        el('h2', {}, `Farmacia ${formatName(p.name)}`),
      ),
    ),
    el('p', { class: 'address' },
      el('span', { class: 'icon', html: ICONS.pin }),
      el('span', {},
        formatAddress(p.address),
        el('br'),
        el('span', { class: 'muted' }, `${p.pc || ''} ${city}`.trim()),
      ),
    ),
    status.detail && el('p', { class: 'hours' }, status.detail),
    el('div', { class: 'actions' },
      el('a', { class: 'btn btn--primary', href: mapsUrl(p, city), target: '_blank', rel: 'noopener' },
        el('span', { class: 'icon', html: ICONS.route }), 'Cómo llegar'),
      phone && el('a', { class: 'btn', href: `tel:${phone.replace(/\s+/g, '')}` },
        el('span', { class: 'icon', html: ICONS.phone }), 'Llamar'),
    ),
    img && el('details', { class: 'plan' },
      el('summary', {}, el('span', { class: 'icon', html: ICONS.map }), 'Ver plano de ubicación'),
      el('img', { src: img, alt: `Plano de ubicación de la farmacia en ${formatAddress(p.address)}`, loading: 'lazy', width: '720', height: '540' }),
    ),
  );
}

function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch { /* sin almacenamiento: no pasa nada */ }
}

function formatQueriedAt(q) {
  const m = String(q ?? '').match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/);
  return m ? `${m[3]}/${m[2]} a las ${m[4]}` : '';
}

export default {
  id: 'farmacias',
  title: 'Farmacias',

  render(container) {
    let locality = readStorage(STORAGE_KEY);
    if (!LOCALITIES[locality]) locality = 'alicante';
    let requestId = 0;

    const today = new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long',
    }).format(new Date());

    const tabs = el('div', { class: 'segmented', role: 'tablist', 'aria-label': 'Localidad' },
      Object.entries(LOCALITIES).map(([key, loc]) =>
        el('button', { type: 'button', role: 'tab', 'data-key': key }, loc.label)),
    );
    const refreshBtn = el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Actualizar', title: 'Actualizar', html: ICONS.refresh });
    const meta = el('p', { class: 'meta', 'aria-live': 'polite' });
    const list = el('div', { class: 'list' });

    container.append(
      el('section', { class: 'hero' },
        el('p', { class: 'eyebrow' }, today),
        el('h1', {}, 'Farmacias de guardia'),
        el('p', { class: 'lede' }, 'Las que están abiertas ahora mismo fuera del horario habitual.'),
      ),
      el('div', { class: 'toolbar' }, tabs, refreshBtn),
      meta,
      list,
    );

    function showSkeleton() {
      list.replaceChildren(...Array.from({ length: 2 }, () => el('div', { class: 'card skeleton', 'aria-hidden': 'true' })));
    }

    function renderList(result, { stale = false } = {}) {
      const city = LOCALITIES[locality].city;
      const when = formatQueriedAt(result.queriedAt);
      meta.textContent = stale
        ? `Sin conexión con el Colegio de Farmacéuticos. Mostrando datos guardados del ${when}.`
        : (when ? `Actualizado el ${when}` : '');
      meta.classList.toggle('meta--warn', stale);

      if (!result.pharmacies.length) {
        list.replaceChildren(el('div', { class: 'empty' },
          el('p', {}, 'No hay farmacias de guardia publicadas para ahora mismo.'),
          el('a', { href: 'https://cofalicante.com/farmacias-de-guardia/', target: '_blank', rel: 'noopener' }, 'Consultar en cofalicante.com'),
        ));
        return;
      }
      list.replaceChildren(...result.pharmacies.map(p => pharmacyCard(p, city)));
    }

    async function load() {
      const id = ++requestId;
      const key = locality;
      for (const b of tabs.children) b.setAttribute('aria-selected', String(b.dataset.key === key));
      meta.textContent = 'Cargando…';
      meta.classList.remove('meta--warn');
      showSkeleton();
      refreshBtn.classList.add('spinning');

      try {
        const result = await getOnDuty(key);
        if (id !== requestId) return;
        writeStorage(CACHE_PREFIX + key, JSON.stringify(result));
        renderList(result);
      } catch (err) {
        if (id !== requestId) return;
        console.error(err);
        let cached = null;
        try { cached = JSON.parse(readStorage(CACHE_PREFIX + key)); } catch { /* nada */ }
        if (cached?.pharmacies) {
          renderList(cached, { stale: true });
        } else {
          meta.textContent = '';
          list.replaceChildren(el('div', { class: 'empty empty--error' },
            el('p', {}, 'No se ha podido conectar con el Colegio de Farmacéuticos.'),
            el('button', { type: 'button', class: 'btn' }, 'Reintentar'),
          ));
          list.querySelector('button').addEventListener('click', load);
        }
      } finally {
        if (id === requestId) refreshBtn.classList.remove('spinning');
      }
    }

    tabs.addEventListener('click', e => {
      const btn = e.target.closest('button[data-key]');
      if (!btn || btn.dataset.key === locality) return;
      locality = btn.dataset.key;
      writeStorage(STORAGE_KEY, locality);
      load();
    });
    refreshBtn.addEventListener('click', load);

    // Al volver a la pestaña (p. ej. app abierta desde ayer), refrescar.
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);

    load();
    return () => {
      requestId++;
      document.removeEventListener('visibilitychange', onVisible);
    };
  },
};
