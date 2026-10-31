// Router mínimo por hash. Para añadir una vista nueva: crear js/views/<vista>.js
// que exporte { id, title, render(container) } y añadirla a VIEWS.
import farmacias from './views/farmacias.js';

const VIEWS = [farmacias];
const DEFAULT_VIEW = VIEWS[0].id;

const nav = document.getElementById('main-nav');
const viewEl = document.getElementById('view');
let cleanup = null;

function renderNav(activeId) {
  nav.innerHTML = '';
  for (const view of VIEWS) {
    const a = document.createElement('a');
    a.href = `#/${view.id}`;
    a.textContent = view.title;
    if (view.id === activeId) a.setAttribute('aria-current', 'page');
    nav.appendChild(a);
  }
}

function route() {
  const id = location.hash.replace(/^#\/?/, '').split('?')[0] || DEFAULT_VIEW;
  const view = VIEWS.find(v => v.id === id) ?? VIEWS.find(v => v.id === DEFAULT_VIEW);

  if (typeof cleanup === 'function') cleanup();
  renderNav(view.id);
  document.title = `${view.title} · Info Alicante`;
  viewEl.innerHTML = '';
  cleanup = view.render(viewEl);
}

window.addEventListener('hashchange', route);
route();
