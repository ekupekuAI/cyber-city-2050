/* CYBER CITY 2050 — isometric city renderer and activation logic. No dependencies. */
(() => {
  'use strict';

  /* ---------- Isometric projection ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const U = 20;              // one grid unit in SVG px
  const COS30 = 0.8660254;
  const OX = 230, OY = 180;  // screen position of grid origin
  const EPS = 1e-6;
  const DRAW_MS = 900;       // keep in sync with --draw in styles.css

  const iso = (x, y, z = 0) => [OX + (x - y) * COS30 * U, OY + (x + y) * 0.5 * U - z * U];
  const r1 = (n) => Math.round(n * 10) / 10;
  const pt = (p) => iso(...p).map(r1).join(' ');
  const points = (list) => list.map((p) => iso(...p).map(r1).join(',')).join(' ');
  const path = (list, close) => list.map((p, i) => (i ? 'L' : 'M') + pt(p)).join(' ') + (close ? ' Z' : '');

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  /* ---------- Primitives ---------- */
  function drawBox(g, b) {
    const { x, y, z = 0, w, d, h } = b;
    const t = z + h;
    el('polygon', { class: 'face ' + (b.left || 'f-hatch'), points: points([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]]) }, g);
    el('polygon', { class: 'face ' + (b.right || 'f-ink'), points: points([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t]]) }, g);
    el('polygon', { class: 'face ' + (b.top || 'f-paper'), points: points([[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]]) }, g);
    if (b.floors) {
      for (let k = b.floors; k < h - 0.3; k += b.floors) {
        el('path', { class: 'win', d: path([[x + w, y + 0.2, z + k], [x + w, y + d - 0.2, z + k]]) }, g);
      }
    }
    if (b.band) {
      el('path', { class: 'band', d: path([[x + 0.25, y + d, z + h * 0.55], [x + w - 0.25, y + d, z + h * 0.55]]) }, g);
    }
  }

  function drawCylinder(g, c) {
    const { cx, cy, r, h } = c;
    const [bx, by] = iso(cx, cy, 0);
    const ty = iso(cx, cy, h)[1];
    const rx = r1(1.2247 * r * U), ry = r1(0.7071 * r * U);
    const L = r1(bx - rx), R = r1(bx + rx);
    el('path', { class: 'face f-ink', d: `M${L} ${r1(ty)} L${L} ${r1(by)} A${rx} ${ry} 0 0 0 ${R} ${r1(by)} L${R} ${r1(ty)} Z` }, g);
    for (let k = 0.55; k < h - 0.2; k += 0.55) {
      const yy = r1(by - k * U);
      el('path', { class: 'win', d: `M${L} ${yy} A${rx} ${ry} 0 0 0 ${R} ${yy}` }, g);
    }
    el('ellipse', { class: 'face f-paper', cx: r1(bx), cy: r1(ty), rx, ry }, g);
    el('ellipse', { class: 'lid', cx: r1(bx), cy: r1(ty), rx: r1(rx * 0.55), ry: r1(ry * 0.55) }, g);
  }

  function drawPanel(g, p) {
    const { x, y, w, d } = p;
    const hi = 0.65, lo = 0.2, cells = 6;
    el('path', { class: 'stem', d: path([[x + 0.2, y + d, lo], [x + 0.2, y + d, 0]]) + ' ' + path([[x + w - 0.2, y + d, lo], [x + w - 0.2, y + d, 0]]) }, g);
    el('polygon', { class: 'face f-ink', points: points([[x, y, hi], [x + w, y, hi], [x + w, y + d, lo], [x, y + d, lo]]) }, g);
    for (let i = 1; i < cells; i++) {
      const xi = x + (w * i) / cells;
      el('path', { class: 'cell', d: path([[xi, y, hi], [xi, y + d, lo]]) }, g);
    }
    el('path', { class: 'cell', d: path([[x, y + d / 2, (hi + lo) / 2], [x + w, y + d / 2, (hi + lo) / 2]]) }, g);
  }

  function drawTurbine(g, t) {
    const [bx, by] = iso(t.x, t.y, 0);
    const [hx, hy] = iso(t.x, t.y, t.h);
    el('path', { class: 'stem', d: `M${r1(bx)} ${r1(by)} L${r1(hx)} ${r1(hy)}` }, g);
    const blades = el('g', { class: 'blades', style: `transform-origin:${r1(hx)}px ${r1(hy)}px` }, g);
    for (const deg of [-90, 30, 150]) {
      const a = (deg * Math.PI) / 180;
      const tx = hx + Math.cos(a) * 27, ty = hy + Math.sin(a) * 27;
      const nx = -Math.sin(a) * 2.2, ny = Math.cos(a) * 2.2;
      el('path', { class: 'blade', d: `M${r1(hx + nx)} ${r1(hy + ny)} L${r1(tx)} ${r1(ty)} L${r1(hx - nx)} ${r1(hy - ny)} Z` }, blades);
    }
    el('circle', { class: 'hubcap', cx: r1(hx), cy: r1(hy), r: 2.6 }, g);
  }

  function drawTree(g, t) {
    const [bx, by] = iso(t.x, t.y, 0);
    const [cx, cy] = iso(t.x, t.y, 0.75);
    el('path', { class: 'stem', d: `M${r1(bx)} ${r1(by)} L${r1(cx)} ${r1(cy)}` }, g);
    el('circle', { class: 'canopy', cx: r1(cx), cy: r1(cy), r: 5 }, g);
  }

  /* Every item exposes an axis-aligned footprint {x,y,z,w,d,h} for depth sorting. */
  const box = (x, y, w, d, h, extra = {}) => ({ kind: 'box', x, y, z: 0, w, d, h, floors: 1, ...extra });
  const cyl = (cx, cy, r, h) => ({ kind: 'cyl', cx, cy, r, h, x: cx - r, y: cy - r, z: 0, w: 2 * r, d: 2 * r });
  const panel = (x, y, w, d) => ({ kind: 'panel', x, y, z: 0, w, d, h: 0.65 });
  const turbine = (x, y, h) => ({ kind: 'turbine', x: x - 0.1, y: y - 0.1, z: 0, w: 0.2, d: 0.2, h, px: x, py: y });
  const tree = (x, y) => ({ kind: 'tree', x: x - 0.1, y: y - 0.1, z: 0, w: 0.2, d: 0.2, h: 0.8, px: x, py: y });
  const mast = (x, y, z, h) => ({ kind: 'box', x: x - 0.06, y: y - 0.06, z, w: 0.12, d: 0.12, h });

  function draw(g, item) {
    switch (item.kind) {
      case 'box': return drawBox(g, item);
      case 'cyl': return drawCylinder(g, item);
      case 'panel': return drawPanel(g, item);
      case 'turbine': return drawTurbine(g, { x: item.px, y: item.py, h: item.h });
      case 'tree': return drawTree(g, { x: item.px, y: item.py });
    }
  }

  /* Painter's order: topological sort of "a is behind b" relations. */
  function depthSort(items) {
    const overlap = (a0, a1, b0, b1) => a0 < b1 - EPS && b0 < a1 - EPS;
    const behind = (a, b) =>
      a.x + a.w <= b.x + EPS ||
      a.y + a.d <= b.y + EPS ||
      (a.z + a.h <= b.z + EPS && overlap(a.x, a.x + a.w, b.x, b.x + b.w) && overlap(a.y, a.y + a.d, b.y, b.y + b.d));
    const n = items.length;
    const after = items.map(() => []);
    const indeg = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j && behind(items[i], items[j]) && !behind(items[j], items[i])) {
          after[i].push(j);
          indeg[j]++;
        }
      }
    }
    const key = (it) => it.x + it.w / 2 + it.y + it.d / 2 + it.z * 0.01;
    const ready = items.map((_, i) => i).filter((i) => indeg[i] === 0);
    const out = [];
    while (ready.length) {
      ready.sort((a, b) => key(items[a]) - key(items[b]));
      const i = ready.shift();
      out.push(items[i]);
      for (const j of after[i]) if (--indeg[j] === 0) ready.push(j);
    }
    return out.length === n ? out : items.slice().sort((a, b) => key(a) - key(b));
  }

  /* ---------- City model (grid 12 x 12, roads on x=6 and y=6) ---------- */
  const DISTRICTS = {
    ai: [
      box(0.5, 0.5, 1.5, 1.5, 5),
      mast(1.25, 1.25, 5, 0.8),
      box(2.4, 0.5, 1.4, 1.5, 7),
      box(4.2, 0.5, 1.0, 1.8, 4),
      box(0.5, 2.4, 1.4, 1.4, 6),
      box(0.5, 4.2, 1.4, 1.0, 3),
      box(4.5, 2.9, 0.8, 2.3, 3),
      box(2.2, 2.6, 2.0, 2.0, 7),                    // civic intelligence core
      box(2.6, 3.0, 1.2, 1.2, 2, { z: 7 }),
      mast(3.2, 3.6, 9, 1.4),
    ],
    transport: [
      box(6.9, 0.5, 1.4, 1.5, 4),
      box(8.7, 0.5, 1.3, 1.2, 3),
      box(10.4, 0.5, 1.2, 1.5, 5),
      box(7.3, 2.75, 0.3, 0.3, 2.6, { floors: 0 }),  // rail pylons
      box(9.3, 2.75, 0.3, 0.3, 2.6, { floors: 0 }),
      box(11.1, 2.75, 0.3, 0.3, 2.6, { floors: 0 }),
      box(6.7, 2.6, 5.0, 0.6, 0.35, { z: 2.6, floors: 0 }),
      box(7.9, 2.63, 2.4, 0.54, 0.6, { z: 2.95, floors: 0, left: 'f-paper', band: true, cls: 'train' }),
      box(6.9, 3.9, 1.4, 1.3, 1.8),
      box(8.8, 3.9, 2.4, 1.4, 2.6),                  // transit control station
      mast(10, 4.6, 2.6, 1.8),
    ],
    energy: [
      cyl(1.2, 7.6, 0.65, 2.2),
      cyl(2.7, 7.6, 0.65, 2.2),
      box(3.8, 7.0, 1.2, 1.2, 6),                    // grid control tower
      mast(4.4, 7.6, 6, 1.8),
      panel(0.5, 9.0, 2.9, 0.7),
      panel(0.5, 10.0, 2.9, 0.7),
      panel(0.5, 11.0, 2.9, 0.7),
      turbine(4.6, 9.4, 4.2),
      turbine(4.5, 11.0, 3.4),
    ],
    civic: [
      tree(7.4, 7.5), tree(8.6, 7.3), tree(7.3, 8.6), tree(8.6, 8.6),
      box(9.6, 7.0, 1.6, 1.2, 2.4),
      box(9.6, 8.7, 1.2, 1.3, 1.8),
      box(7.0, 9.6, 1.4, 1.5, 2.2),
      box(8.7, 9.8, 1.3, 1.2, 1.6),
      box(10.3, 10.3, 1.3, 1.3, 3),
    ],
  };

  const NODES = [
    {
      id: 'ai', label: 'AI', at: [3.2, 3.6, 10.4], tag: 'right',
      route: [[6, 6, 0], [3.2, 6, 0], [3.2, 4.6, 0], [3.2, 4.6, 7], [3.2, 4.2, 7], [3.2, 4.2, 9], [3.2, 3.6, 9], [3.2, 3.6, 10.4]],
    },
    {
      id: 'transport', label: 'TRANSPORT', at: [10, 4.6, 4.4], tag: 'right',
      route: [[6, 6, 0], [10, 6, 0], [10, 5.3, 0], [10, 5.3, 2.6], [10, 4.6, 2.6], [10, 4.6, 4.4]],
    },
    {
      id: 'energy', label: 'ENERGY', at: [4.4, 7.6, 7.8], tag: 'left',
      route: [[6, 6, 0], [6, 7.6, 0], [5, 7.6, 0], [5, 7.6, 6], [4.4, 7.6, 6], [4.4, 7.6, 7.8]],
    },
  ];

  /* ---------- Build the SVG ---------- */
  const svg = document.getElementById('city');
  if (!svg) return;

  function buildGround(g) {
    drawBox(g, { x: 0, y: 0, z: -0.6, w: 12, d: 12, h: 0.6 });
    for (const [x, y] of [[0.2, 0.2], [6.6, 0.2], [0.2, 6.6], [6.6, 6.6]]) {
      drawBox(g, { x, y, w: 5.2, d: 5.2, h: 0.15 });
      for (let i = 1; i < 5.2; i++) {
        for (let j = 1; j < 5.2; j++) {
          const [cx, cy] = iso(x + i, y + j, 0.15);
          el('circle', { class: 'grid-dot', cx: r1(cx), cy: r1(cy), r: 0.8 }, g);
        }
      }
    }
    drawBox(g, { x: 6.9, y: 6.9, z: 0.15, w: 2.3, d: 2.3, h: 0.05, top: 'f-hatch' }); // park
    el('path', { class: 'road-center', d: path([[0.2, 6, 0], [11.8, 6, 0]]) + ' ' + path([[6, 0.2, 0], [6, 11.8, 0]]) }, g);
  }

  function buildDistricts() {
    const groups = {};
    for (const id of ['ai', 'transport', 'energy', 'civic']) {
      const g = el('g', { class: 'district', 'data-district': id }, svg);
      for (const item of depthSort(DISTRICTS[id])) draw(item.cls ? el('g', { class: item.cls }, g) : g, item);
      groups[id] = g;
    }
    return groups;
  }

  function buildNode(layer, n) {
    const [x, y] = iso(...n.at).map(r1);
    const g = el('g', { class: 'node', 'data-node': n.id, transform: `translate(${x} ${y})` }, layer);
    el('circle', { class: 'node__hit', r: 30 }, g);
    el('circle', { class: 'node__pulse', r: 15 }, g);
    el('circle', { class: 'node__ring', r: 15 }, g);
    el('circle', { class: 'node__core', r: 5.5 }, g);
    const w = Math.ceil(n.label.length * 13 * 0.68 + 16);
    const right = n.tag === 'right';
    el('path', { class: 'node__leader', d: right ? 'M15 0H22' : 'M-15 0H-22' }, g);
    const tag = el('g', { class: 'node__tag', transform: `translate(${right ? 22 : -22 - w} -11)` }, g);
    el('rect', { width: w, height: 22 }, tag);
    const text = el('text', { x: 8, y: 15.5 }, tag);
    text.textContent = n.label;
    return g;
  }

  function buildCity() {
    buildGround(el('g', { class: 'ground' }, svg));
    const districts = buildDistricts();

    const routes = el('g', { class: 'routes', 'aria-hidden': 'true' }, svg);
    const links = el('g', { class: 'links' }, svg);
    for (const n of NODES) {
      el('path', { class: 'route', d: path(n.route) }, routes);
      const lg = el('g', { class: 'link-group', 'data-node': n.id }, links);
      el('path', { class: 'link-case', d: path(n.route), pathLength: 1 }, lg);
      el('path', { class: 'link', d: path(n.route), pathLength: 1 }, lg);
      n.link = lg;
      n.district = districts[n.id];
    }

    // hub: signal source at the crossroads
    const hub = el('g', { class: 'hub' }, svg);
    const [hx, hy] = iso(6, 6, 0);
    const rx = r1(1.2247 * 1.5 * U), ry = r1(0.7071 * 1.5 * U);
    el('path', {
      class: 'hub-ring', pathLength: 1,
      d: `M${r1(hx - rx)} ${r1(hy)} A${rx} ${ry} 0 1 0 ${r1(hx + rx)} ${r1(hy)} A${rx} ${ry} 0 1 0 ${r1(hx - rx)} ${r1(hy)}`,
    }, hub);
    drawBox(hub, { x: 5.55, y: 5.55, w: 0.9, d: 0.9, h: 0.3, top: 'f-signal' });
    const hubTag = el('g', { class: 'hub-tag', transform: `translate(${r1(hx + 14)} ${r1(hy + 12)})` }, hub);
    el('rect', { width: 34, height: 16 }, hubTag);
    el('text', { x: 5, y: 11.5 }, hubTag).textContent = 'HUB';

    // mesh: closes the network once all three are online
    el('path', { class: 'mesh', pathLength: 1, d: path(NODES.map((n) => n.at), true) }, svg);

    const nodeLayer = el('g', { class: 'nodes' }, svg);
    for (const n of NODES) n.node = buildNode(nodeLayer, n);

    // north arrow
    const [nx, ny] = [404, 412];
    const north = el('g', { class: 'annot', 'aria-hidden': 'true' }, svg);
    el('path', { class: 'stem', d: `M${nx} ${ny} L${r1(nx + 20.8)} ${r1(ny - 12)} M${r1(nx + 13.6)} ${r1(ny - 11.8)} L${r1(nx + 20.8)} ${r1(ny - 12)} L${r1(nx + 17.5)} ${r1(ny - 5.6)}` }, north);
    const nt = el('text', { class: 'svg-label', x: nx + 25, y: ny - 14 }, north);
    nt.textContent = 'N';
  }

  buildCity();

  /* ---------- Motion preference ---------- */
  const root = document.documentElement;
  const toggle = document.getElementById('motion-toggle');
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stored = null;
  try { stored = localStorage.getItem('cc2050-motion'); } catch (e) { /* storage unavailable */ }

  function applyMotion(reduce) {
    root.dataset.motion = reduce ? 'reduce' : 'full';
    toggle.setAttribute('aria-pressed', String(reduce));
  }
  applyMotion(stored ? stored === 'reduce' : mq.matches);
  mq.addEventListener('change', (e) => { if (!stored) applyMotion(e.matches); });
  toggle.addEventListener('click', () => {
    const reduce = root.dataset.motion !== 'reduce';
    applyMotion(reduce);
    stored = reduce ? 'reduce' : 'full';
    try { localStorage.setItem('cc2050-motion', stored); } catch (e) { /* ignore */ }
  });
  const reduced = () => root.dataset.motion === 'reduce';

  /* ---------- State + UI ---------- */
  const consoleEl = document.getElementById('console');
  const success = document.getElementById('success');
  const stage = document.getElementById('stage');
  const countEl = document.getElementById('count');
  const figStatus = document.getElementById('fig-status');
  const meter = [...document.querySelectorAll('.meter i')];
  const restartBtn = document.getElementById('restart');
  const announcer = document.getElementById('announcer');
  const NAMES = { ai: 'AI', transport: 'Transport', energy: 'Energy' };

  const byId = {};
  for (const n of NODES) {
    n.button = document.querySelector(`.system[data-node="${n.id}"]`);
    n.stateEl = n.button.querySelector('.system__state');
    byId[n.id] = n;
  }

  const state = { on: new Set(), busy: new Set(), complete: false, timers: [] };
  const later = (fn, ms) => state.timers.push(setTimeout(fn, ms));

  function announce(msg) {
    announcer.textContent = '';
    requestAnimationFrame(() => { announcer.textContent = msg; });
  }

  function renderProgress() {
    const k = state.on.size;
    countEl.textContent = k;
    figStatus.textContent = k === 3 ? 'All systems online' : `${k}/3 linked`;
    meter.forEach((m, i) => m.classList.toggle('is-on', i < k));
    restartBtn.disabled = k === 0 && state.busy.size === 0;
  }

  function activate(id) {
    const n = byId[id];
    if (!n || state.complete || state.on.has(id) || state.busy.has(id)) return;
    state.busy.add(id);
    n.link.classList.add('is-drawn');
    n.node.classList.add('is-linking');
    n.button.classList.add('is-linking');
    n.stateEl.textContent = 'Linking';
    renderProgress();

    later(() => {
      state.busy.delete(id);
      state.on.add(id);
      n.node.classList.remove('is-linking');
      n.node.classList.add('is-on');
      n.district.classList.add('is-on');
      n.button.classList.remove('is-linking');
      n.button.setAttribute('aria-pressed', 'true');
      n.stateEl.textContent = 'Online';
      renderProgress();
      if (state.on.size === NODES.length) complete();
      else announce(`${NAMES[id]} connected. ${state.on.size} of 3 systems online.`);
    }, reduced() ? 0 : DRAW_MS);
  }

  function complete() {
    state.complete = true;
    svg.classList.add('is-complete');
    announce('All three systems online.');
    later(() => {
      consoleEl.hidden = true;
      success.hidden = false;
      success.classList.add('is-entering');
      success.focus({ preventScroll: true });
      const r = success.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        success.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
      }
    }, reduced() ? 0 : DRAW_MS + 200);
  }

  function restart() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.on.clear();
    state.busy.clear();
    state.complete = false;

    svg.classList.add('is-resetting');
    svg.classList.remove('is-complete');
    for (const n of NODES) {
      n.link.classList.remove('is-drawn');
      n.node.classList.remove('is-on', 'is-linking', 'is-hint');
      n.district.classList.remove('is-on');
      n.button.classList.remove('is-linking');
      n.button.setAttribute('aria-pressed', 'false');
      n.stateEl.textContent = 'Offline';
    }
    void svg.getBoundingClientRect(); // flush styles so lines retract instantly
    svg.classList.remove('is-resetting');

    const fromSuccess = !success.hidden;
    success.hidden = true;
    success.classList.remove('is-entering');
    consoleEl.hidden = false;
    renderProgress();
    announce('City reset. All three systems offline.');
    if (fromSuccess) {
      if (stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      byId.ai.button.focus({ preventScroll: true });
    }
  }

  /* ---------- Events ---------- */
  for (const n of NODES) {
    n.node.addEventListener('click', () => activate(n.id));
    n.button.addEventListener('click', () => activate(n.id));
    const hint = (on) => () => n.node.classList.toggle('is-hint', on && !state.on.has(n.id));
    n.button.addEventListener('mouseenter', hint(true));
    n.button.addEventListener('mouseleave', hint(false));
    n.button.addEventListener('focus', hint(true));
    n.button.addEventListener('blur', hint(false));
  }
  restartBtn.addEventListener('click', restart);
  document.getElementById('restart-success').addEventListener('click', restart);

  renderProgress();
})();
