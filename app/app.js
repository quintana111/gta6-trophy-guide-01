// Leonida 55 — offline GTA VI trophy guide + tracker.
// Own code, written for this entry. Data: app/data/trophies.json (official names,
// descriptions, grades). State lives in localStorage; nothing is fetched at run time
// except the trophy file under app/ itself.
const STORE_EARNED = 'leonida55.earned.v1';
const STORE_REVEALED = 'leonida55.revealed.v1';
const STORE_SPOILER = 'leonida55.spoilers.v1';
const EXPORT_VERSION = 1;

const view = document.getElementById('view');
const ringFg = document.getElementById('ringFg');
const ringLabel = document.getElementById('ringLabel');
const globalSearch = document.getElementById('globalSearch');
const spoilerToggle = document.getElementById('spoilerToggle');

const doc = await (await fetch('data/trophies.json')).json();
const TROPHY_LIST = doc.trophies ?? doc;

// ---- Fallback kind / stage / flags -----------------------------------------
// Used ONLY when trophies.json does not carry the fields yet (Builder B fills
// them with researched data). The lists below come from DESIGN.md's kind table
// and roadmap stages; they are defaults, never a replacement for real data.
const KIND_BY_ID = {};
for (const id of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) KIND_BY_ID[id] = 'story';
for (const id of [22, 23, 24, 25, 26, 27]) KIND_BY_ID[id] = 'stranger';
for (const id of [15, 16, 17, 18, 19, 20, 21, 28, 29, 32, 33, 51]) KIND_BY_ID[id] = 'activity';
for (const id of [30, 31, 35, 54, 55]) KIND_BY_ID[id] = 'collectible';
for (const id of [34, 38, 39, 40, 41, 43]) KIND_BY_ID[id] = 'robbery';
for (const id of [36, 37, 42, 44, 45, 46, 47, 48, 49, 50, 52, 53]) KIND_BY_ID[id] = 'exploration';
const STAGE_BY_ID = { 1: 7, 2: 1, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 14: 7 };
const CRITICAL_100_IDS = new Set([3, 4, 5, 6, 7, 15, 28, 30, 31, 40, 54]);

function enrichTrophy(t) {
  const kind = t.kind ?? (t.id === 1 ? 'platinum' : t.id === 14 ? 'completion' : (KIND_BY_ID[t.id] ?? 'exploration'));
  let stage = t.stage;
  if (stage === undefined || stage === null) {
    if (STAGE_BY_ID[t.id] !== undefined) stage = STAGE_BY_ID[t.id];
    else if (kind === 'story') stage = 5; // mission trophies: chapter unassigned until researched
    else stage = 6; // side content: cleanup stage
  }
  return {
    ...t,
    kind,
    stage,
    hidden: t.hidden ?? (kind === 'story'), // story trophies are hidden on PlayStation
    missable: t.missable ?? (t.id === 28),
    critical100: t.critical100 ?? CRITICAL_100_IDS.has(t.id),
    steps: t.steps ?? [],
    sources: t.sources ?? [],
    where: t.where ?? '',
    when: t.when ?? '',
  };
}

const TROPHIES = TROPHY_LIST.map(enrichTrophy);

// ---- State -----------------------------------------------------------------
function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? '[]')); } catch { return new Set(); }
}
const state = {
  earned: loadSet(STORE_EARNED),
  revealed: loadSet(STORE_REVEALED),
  spoilers: localStorage.getItem(STORE_SPOILER) === '1',
  filter: 'all',
  search: '',
  trackerScope: 'all',
};
function saveEarned() { localStorage.setItem(STORE_EARNED, JSON.stringify([...state.earned].sort((a, b) => a - b))); }
function saveRevealed() { localStorage.setItem(STORE_REVEALED, JSON.stringify([...state.revealed].sort((a, b) => a - b))); }
function saveSpoilers() { localStorage.setItem(STORE_SPOILER, state.spoilers ? '1' : '0'); }

function isMasked(t) {
  return t.hidden && !state.spoilers && !state.earned.has(t.id) && !state.revealed.has(t.id);
}
function displayName(t) { return isMasked(t) ? 'Hidden trophy' : t.name; }
function displayDesc(t) { return isMasked(t) ? 'Hidden trophy — earn it or reveal it.' : t.description; }

function updateRing() {
  const n = state.earned.size, total = TROPHIES.length;
  ringLabel.textContent = `${n}/${total}`;
  ringFg.style.strokeDashoffset = String(132 * (1 - n / total));
  spoilerToggle.checked = state.spoilers;
}

// ---- Export / import --------------------------------------------------------
function exportState() {
  return {
    app: 'leonida-55', version: EXPORT_VERSION, exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    revealed: [...state.revealed].sort((a, b) => a - b),
    spoilers: state.spoilers,
  };
}
function downloadExport() {
  const blob = new Blob([JSON.stringify(exportState(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-55-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function importState(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'leonida-55' || typeof data.version !== 'number') {
    throw new Error('Not a Leonida 55 export file.');
  }
  const valid = new Set(TROPHIES.map((t) => t.id));
  const keep = (list) => [...new Set((list ?? []).filter((id) => valid.has(id)))].sort((a, b) => a - b);
  state.earned = new Set(keep(data.earned));
  state.revealed = new Set(keep(data.revealed));
  if (typeof data.spoilers === 'boolean') state.spoilers = data.spoilers;
  saveEarned(); saveRevealed(); saveSpoilers();
}
function resetState() {
  state.earned = new Set(); state.revealed = new Set();
  saveEarned(); saveRevealed();
}

// ---- Shared bits ------------------------------------------------------------
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
function gradeLabel(t) { return t.grade[0].toUpperCase() + t.grade.slice(1); }
function kindLabel(kind) {
  return { story: 'Story', stranger: 'Strangers', activity: 'Activities', collectible: 'Collectibles', robbery: 'Robberies', exploration: 'Exploration', platinum: 'Platinum', completion: '100% Completion' }[kind] ?? kind;
}
function stageName(n) {
  return ['Setup', 'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Final mission', 'Side cleanup', '100% gate'][n] ?? `Stage ${n}`;
}
function badgesFor(t) {
  const out = [`<span class="badge kind">${esc(kindLabel(t.kind))}</span>`];
  out.push(`<span class="badge">Stage ${t.stage} · ${esc(stageName(t.stage))}</span>`);
  if (t.hidden) out.push('<span class="badge hidden-b">Hidden</span>');
  if (t.missable) out.push('<span class="badge missable">Missable</span>');
  if (t.critical100) out.push('<span class="badge critical">100% Critical</span>');
  return out.join(' ');
}
function progressBar(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><div class="bar-label">${done} of ${total} earned · ${pct}%</div>`;
}
function trophyRow(t) {
  const li = document.createElement('li');
  li.className = 't-row' + (state.earned.has(t.id) ? ' earned' : '');
  const box = document.createElement('input');
  box.type = 'checkbox'; box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${displayName(t)} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) state.earned.add(t.id); else state.earned.delete(t.id);
    saveEarned(); updateRing(); render();
  });
  const mid = document.createElement('div');
  mid.innerHTML = `<h3 class="t-name"><a href="#/trophy/${t.id}">${esc(displayName(t))}</a></h3>
    <p class="t-desc${isMasked(t) ? ' masked' : ''}">${esc(displayDesc(t))}</p>
    <div class="t-badges">${badgesFor(t)}</div>
    ${isMasked(t) ? `<p><button type="button" class="btn ghost" data-reveal="${t.id}">Reveal this trophy</button></p>` : ''}`;
  const reveal = mid.querySelector('[data-reveal]');
  if (reveal) reveal.addEventListener('click', () => { state.revealed.add(t.id); saveRevealed(); render(); });
  const grade = document.createElement('div');
  grade.className = 't-grade';
  grade.innerHTML = `<span class="badge grade-${esc(t.grade)}">${esc(gradeLabel(t))}</span><br>#${t.id}`;
  li.append(box, mid, grade);
  return li;
}
function matchesSearch(t, q) {
  if (!q) return true;
  const hay = [t.name, t.description, t.guide, t.where, t.when, kindLabel(t.kind), ...(t.steps ?? []),
    ...t.sources.map((s) => `${s.site ?? ''} ${s.title ?? ''}`)].join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}
function filteredTrophies() {
  const f = state.filter, q = state.search;
  return TROPHIES.filter((t) => {
    if (state.stageOnly !== undefined && t.stage !== state.stageOnly) return false;
    if (!matchesSearch(t, q)) return false;
    switch (f) {
      case 'all': return true;
      case 'story': return t.kind === 'story';
      case 'strangers': return t.kind === 'stranger';
      case 'activities': return t.kind === 'activity';
      case 'collectibles': return t.kind === 'collectible';
      case 'robberies': return t.kind === 'robbery';
      case 'exploration': return t.kind === 'exploration';
      case 'missable': return t.missable;
      case 'hidden': return t.hidden;
      case 'critical100': return t.critical100;
      case 'online': return false; // no online trophies exist in GTA VI
      default: return true;
    }
  });
}

// ---- Views ------------------------------------------------------------------
const FILTERS = [
  ['all', 'All'], ['story', 'Story'], ['strangers', 'Strangers'], ['activities', 'Activities'],
  ['collectibles', 'Collectibles'], ['robberies', 'Robberies'], ['exploration', 'Exploration'],
  ['missable', 'Missable'], ['hidden', 'Hidden'], ['critical100', '100% Critical'], ['online', 'Online'],
];
function filterCounts() {
  const counts = { all: TROPHIES.length, online: 0 };
  for (const t of TROPHIES) {
    counts.missable = (counts.missable ?? 0) + (t.missable ? 1 : 0);
    counts.hidden = (counts.hidden ?? 0) + (t.hidden ? 1 : 0);
    counts.critical100 = (counts.critical100 ?? 0) + (t.critical100 ? 1 : 0);
    const key = { story: 'story', stranger: 'strangers', activity: 'activities', collectible: 'collectibles', robbery: 'robberies', exploration: 'exploration' }[t.kind];
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
function renderTrophies() {
  const counts = filterCounts();
  const list = filteredTrophies();
  const stageNote = state.stageOnly !== undefined ? ` · Stage ${state.stageOnly} (${stageName(state.stageOnly)})` : '';
  view.innerHTML = '';
  const head = el(`<div><h1>Trophies</h1>
    <p class="lede">All 55 PlayStation 5 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze. Tick a trophy when you earn it; it stays ticked in this browser. Hidden trophies stay masked until earned or revealed, unless Spoilers is on.</p>
    <div class="chips" role="group" aria-label="Filter trophies"></div>
    <p class="count-line" id="countLine"></p></div>`);
  const chips = head.querySelector('.chips');
  for (const [key, label] of FILTERS) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip' + (state.filter === key ? ' active' : '');
    b.innerHTML = `${esc(label)} <span class="n">${counts[key] ?? 0}</span>`;
    b.addEventListener('click', () => { state.filter = key; state.stageOnly = undefined; render(); });
    chips.append(b);
  }
  view.append(head);
  view.querySelector('#countLine').textContent =
    `Showing ${list.length} of ${TROPHIES.length} trophies${stageNote}` +
    (state.filter === 'online' ? ' — GTA VI has no online trophies, so this filter is empty by design.' : '') +
    (state.search ? ` matching “${state.search}”.` : '.');
  if (!list.length) { view.append(el('<p class="empty">No trophies match this filter.</p>')); return; }
  const ul = document.createElement('ul');
  ul.className = 't-list';
  for (const t of list) ul.append(trophyRow(t));
  view.append(ul);
}

const STAGE_NOTES = {
  0: 'Set your spoiler preference, check export and import work, and read the Chapter 1 warning before you start. No trophies here.',
  1: 'Paradise Lost, Gone Fishing and the first mission trophies. Do the balcony meditation NOW — see the warning below.',
  2: 'T**s Ass Drug Money and its mission trophies. Stranger strands open; both characters are playable.',
  3: 'Vice City, Baby! and its mission trophies.',
  4: 'Top Of The World, Ma and its mission trophies. Finish chapter-linked side content before the finale.',
  5: 'The final mission — You Gotta Know When to Get Off (gold). Confirm every chapter and mission trophy before cleanup.',
  6: 'Everything else: stranger finals, 250 stunts, shooting-range gold, drone races, 20 races, fishing vs Cal, arcade, card sets, 100 WAiNK, 100 vehicles, garages, Scooter Bros, robberies, exploration, 50 challenges, $250k laundering, $100k spending.',
  7: 'Verify the A Long Road checklist, then earn A Long Road (gold) and the platinum, Vice Got a Price!',
};
function renderRoadmap() {
  view.innerHTML = '';
  const head = el(`<div><h1>Roadmap to the Platinum</h1>
    <p class="lede">One playthrough is enough — about 200 hours to the platinum. Follow the stages in order; the only trophy that can be locked out is in Stage 1.</p>
    <div class="sunband" aria-hidden="true"></div>
    <div class="warn" role="alert"><strong>⚠ Before finishing Chapter 1:</strong>
    <p>Meditate at Lucia&rsquo;s balcony spot. It disappears after Chapter 1 and there is no mission replay; if missed, Positive Mental Attitude and 100% completion are locked out on that save.</p></div></div>`);
  view.append(head);
  const ol = document.createElement('ol');
  ol.className = 'stages';
  for (let s = 0; s <= 7; s++) {
    const group = TROPHIES.filter((t) => t.stage === s);
    const done = group.filter((t) => state.earned.has(t.id)).length;
    const miss = group.filter((t) => t.missable);
    const li = el(`<li class="stage${s === 7 ? ' gate' : ''}"><div class="stage-num">${s}</div>
      <div><h2 class="stage-name">Stage ${s} — ${esc(stageName(s))}</h2>
      <p class="stage-meta">${group.length} ${group.length === 1 ? 'trophy' : 'trophies'}${miss.length ? ' · <span class="badge missable">Missable inside</span>' : ''}</p>
      <p>${esc(STAGE_NOTES[s])}</p>
      ${progressBar(done, group.length)}
      <a class="stage-link" href="#/trophies" data-stage="${s}">See this stage&rsquo;s trophies →</a></div></li>`);
    li.querySelector('[data-stage]').addEventListener('click', () => { state.stageOnly = s; state.filter = 'all'; });
    ol.append(li);
  }
  view.append(ol);
  view.append(el('<div class="wave" aria-hidden="true"></div><p class="lede">100% gate checklist (A Long Road): story complete, 250 stunts, 100 WAiNK, 3 card sets, every meditation spot, all garages, 5 bank vaults.</p>'));
}

function renderTracker() {
  view.innerHTML = '';
  const done = state.earned.size;
  const head = el(`<div><h1>Tracker</h1>
    <p class="lede">Your checklist, grouped by roadmap stage, then by kind. Progress is saved in this browser as you tick.</p>
    <div class="next-box"><button type="button" class="btn" id="nextBtn">Next unchecked →</button>
    <span id="nextLabel"></span></div>
    <div class="chips" role="group" aria-label="Tracker scope">
      <button type="button" class="chip${state.trackerScope === 'all' ? ' active' : ''}" data-scope="all">All trophies</button>
      <button type="button" class="chip${state.trackerScope === 'available' ? ' active' : ''}" data-scope="available">Available now</button>
      <button type="button" class="chip${state.trackerScope === 'critical' ? ' active' : ''}" data-scope="critical">Covered by A Long Road</button>
    </div>
    ${progressBar(done, TROPHIES.length)}</div>`);
  view.append(head);
  head.querySelectorAll('[data-scope]').forEach((b) => b.addEventListener('click', () => { state.trackerScope = b.dataset.scope; render(); }));
  const next = TROPHIES.filter((t) => !state.earned.has(t.id))
    .filter((t) => state.trackerScope !== 'critical' || t.critical100)
    .sort((a, b) => a.stage - b.stage || a.id - b.id)[0];
  const nextBtn = head.querySelector('#nextBtn');
  const nextLabel = head.querySelector('#nextLabel');
  if (next) {
    nextLabel.textContent = `Next: ${displayName(next)} — Stage ${next.stage}, ${kindLabel(next.kind)}.`;
    nextBtn.addEventListener('click', () => { location.hash = `#/trophy/${next.id}`; });
  } else {
    nextLabel.textContent = 'Everything is earned — Leonida Legend!';
    nextBtn.disabled = true;
  }
  const scopeList = TROPHIES.filter((t) =>
    state.trackerScope === 'critical' ? t.critical100 : state.trackerScope === 'available' ? t.stage <= 6 : true);
  for (let s = 0; s <= 7; s++) {
    const inStage = scopeList.filter((t) => t.stage === s);
    if (!inStage.length) continue;
    const kinds = [...new Set(inStage.map((t) => t.kind))];
    for (const kind of kinds) {
      const group = inStage.filter((t) => t.kind === kind);
      const gDone = group.filter((t) => state.earned.has(t.id)).length;
      const sec = el(`<section class="group"><h2>Stage ${s} · ${esc(stageName(s))} — ${esc(kindLabel(kind))}</h2>
        ${progressBar(gDone, group.length)}<ul class="check-list"></ul></section>`);
      const ul = sec.querySelector('ul');
      for (const t of group) {
        const li = document.createElement('li');
        const box = document.createElement('input');
        box.type = 'checkbox'; box.checked = state.earned.has(t.id);
        box.setAttribute('aria-label', `Mark ${displayName(t)} as earned`);
        box.addEventListener('change', () => {
          if (box.checked) state.earned.add(t.id); else state.earned.delete(t.id);
          saveEarned(); updateRing(); render();
        });
        const span = document.createElement('span');
        span.className = state.earned.has(t.id) ? 'done' : '';
        const a = document.createElement('a');
        a.href = `#/trophy/${t.id}`; a.textContent = displayName(t);
        span.append(a);
        if (t.missable) span.append(document.createTextNode(' '), el('<span class="badge missable">Missable</span>'));
        if (t.critical100) span.append(document.createTextNode(' '), el('<span class="badge critical">100% Critical</span>'));
        li.append(box, span);
        ul.append(li);
      }
      view.append(sec);
    }
  }
}

function sourceLine(s) {
  const bits = [];
  if (s.site) bits.push(esc(s.site));
  if (s.title) bits.push(`“${esc(s.title)}”`);
  if (s.url) bits.push(`<a href="${esc(s.url)}" rel="noopener">${esc(s.url)}</a>`);
  if (s.supports) bits.push(`<span class="supports">supports ${esc(s.supports)}</span>`);
  return `<li>${bits.join(', ') || 'Source recorded without details.'}</li>`;
}
function renderTrophy(id) {
  const t = TROPHIES.find((x) => x.id === id);
  view.innerHTML = '';
  if (!t) { view.append(el('<p class="empty">No trophy with that number.</p>')); return; }
  const prev = TROPHIES.find((x) => x.id === id - 1);
  const next = TROPHIES.find((x) => x.id === id + 1);
  const wrap = el(`<div>
    <p class="crumb"><a href="#/trophies">Trophies</a> / <a href="#/roadmap">Stage ${t.stage}</a> / #${t.id}</p>
    <div class="detail"><div>
      <h1>${esc(displayName(t))}</h1>
      <p class="t-desc${isMasked(t) ? ' masked' : ''}">${esc(displayDesc(t))}</p>
      <div class="t-badges"><span class="badge grade-${esc(t.grade)}">${esc(gradeLabel(t))}</span> ${badgesFor(t)}</div>
      ${t.missable ? `<div class="warn" role="alert" style="margin-top:12px"><strong>⚠ Missable — read this first:</strong><p>Before finishing Chapter 1, meditate at Lucia&rsquo;s balcony spot. It disappears after Chapter 1 and there is no mission replay; if missed, this trophy and 100% completion are locked out on that save.</p></div>` : ''}
      <section class="guide-card"><h2>Guide</h2>
        ${isMasked(t) ? '<p class="placeholder">This trophy is hidden — earn it, reveal it, or turn Spoilers on to read its guide.</p>'
          : `${t.guide ? `<p>${esc(t.guide)}</p>` : '<p class="placeholder">Guide text is being written for this trophy.</p>'}
        ${t.steps.length ? `<h2>Steps</h2><ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
        ${t.where ? `<p><strong>Where:</strong> ${esc(t.where)}</p>` : ''}
        ${t.when ? `<p><strong>When:</strong> ${esc(t.when)}</p>` : ''}`}
      </section>
      <section class="guide-card"><h2>Sources</h2>
        ${t.sources.length ? `<ul class="src-list">${t.sources.map(sourceLine).join('')}</ul>` : '<p class="placeholder">Sources for this trophy are being added — every guide cites the source each fact comes from.</p>'}
      </section>
    </div>
    <aside class="rail-card"><h2>Your progress</h2>
      <label class="earn-row"><input type="checkbox" id="earnBox" ${state.earned.has(t.id) ? 'checked' : ''}> Earned</label>
      ${isMasked(t) ? '<p><button type="button" class="btn ghost" id="revealBtn">Reveal this trophy</button></p>' : ''}
      <dl>
        <dt>Grade</dt><dd>${esc(gradeLabel(t))}</dd>
        <dt>Kind</dt><dd>${esc(kindLabel(t.kind))}</dd>
        <dt>Stage</dt><dd>${t.stage} — ${esc(stageName(t.stage))}</dd>
        <dt>Hidden</dt><dd>${t.hidden ? 'Yes — masked until earned' : 'No'}</dd>
        <dt>Missable</dt><dd>${t.missable ? 'Yes' : 'No'}</dd>
        <dt>100% critical</dt><dd>${t.critical100 ? 'Yes — needed for A Long Road' : 'No'}</dd>
      </dl>
      <div class="prevnext">
        ${prev ? `<a href="#/trophy/${prev.id}">← #${prev.id} ${esc(displayName(prev))}</a>` : '<span></span>'}
        ${next ? `<a href="#/trophy/${next.id}">#${next.id} ${esc(displayName(next))} →</a>` : ''}
      </div>
    </aside></div></div>`);
  view.append(wrap);
  wrap.querySelector('#earnBox').addEventListener('change', (e) => {
    if (e.target.checked) state.earned.add(t.id); else state.earned.delete(t.id);
    saveEarned(); updateRing(); render();
  });
  const rb = wrap.querySelector('#revealBtn');
  if (rb) rb.addEventListener('click', () => { state.revealed.add(t.id); saveRevealed(); render(); });
}

function renderSources() {
  const seen = new Map();
  for (const t of TROPHIES) for (const s of t.sources) {
    const key = s.url || `${s.site}|${s.title}`;
    if (!seen.has(key)) seen.set(key, { ...s, trophies: [] });
    seen.get(key).trophies.push(t.id);
  }
  view.innerHTML = '';
  const head = el(`<div><h1>Sources</h1>
    <p class="lede">Every guide cites the source each fact comes from — a named guide or a link, beside the trophy it supports. The official names, descriptions and grades are PlayStation&rsquo;s list, shown as published. The list below is built from the sources recorded in the trophy data.</p></div>`);
  view.append(head);
  if (!seen.size) {
    view.append(el(`<section class="guide-card"><h2>Sources recorded so far</h2>
      <p class="placeholder">No per-trophy sources are recorded in the trophy data yet. The official list itself was verified against the published lists (PSNProfiles, outputlag, gtabase) before this guide was built; per-trophy citations are added with each guide.</p></section>`));
    return;
  }
  const sec = el('<section class="guide-card"><h2>All sources</h2><ul class="src-list"></ul></section>');
  const ul = sec.querySelector('ul');
  for (const s of seen.values()) {
    const li = document.createElement('li');
    li.innerHTML = sourceLine(s) + ` <span class="supports">— supports trophies ${s.trophies.map((n) => `#${n}`).join(', ')}</span>`;
    ul.append(li);
  }
  view.append(sec);
}

function renderSettings() {
  view.innerHTML = '';
  const card = el(`<div><h1>Settings</h1>
    <p class="lede">Spoilers, export, import and reset. Everything here stays in your browser unless you export it.</p>
    <section class="settings-card"><h2>Spoilers</h2>
      <p>With spoilers off, hidden trophies show a masked name and description until you earn them or reveal them one by one. With spoilers on, everything is shown.</p>
      <label class="earn-row"><input type="checkbox" id="setSpoiler" ${state.spoilers ? 'checked' : ''}> Show spoilers (unmask hidden trophies)</label>
    </section>
    <section class="settings-card"><h2>Export progress</h2>
      <p>Download a versioned JSON file with your earned trophies, revealed trophies and spoiler setting. It round-trips exactly: export, reset, import restores the same set.</p>
      <div class="row"><button type="button" class="btn" id="exportBtn">Export progress</button>
      <button type="button" class="btn ghost" id="copyBtn">Copy export JSON</button></div>
      <p class="status" id="exportStatus" role="status"></p>
    </section>
    <section class="settings-card"><h2>Import progress</h2>
      <p>Paste a Leonida 55 export, or choose its file. Import replaces your current progress with the file&rsquo;s.</p>
      <textarea id="importText" placeholder='{"app": "leonida-55", "version": 1, "earned": […]}' aria-label="Export JSON to import"></textarea>
      <div class="row"><button type="button" class="btn" id="importBtn">Import pasted JSON</button>
      <label class="btn ghost">Choose file <input type="file" id="importFile" accept="application/json" class="visually-hidden"></label></div>
      <p class="status" id="importStatus" role="status"></p>
    </section>
    <section class="settings-card"><h2>Reset</h2>
      <p>Clear every earned tick and every per-trophy reveal in this browser. This cannot be undone — export first if you want a copy.</p>
      <div class="row"><button type="button" class="btn coral" id="resetBtn">Reset checklist</button></div>
      <p class="status" id="resetStatus" role="status"></p>
    </section>
    <section class="settings-card"><h2>Offline note</h2>
      <p>This guide works with the network off. Every file it loads lives under app/; it makes no network requests at run time.</p>
    </section></div>`);
  view.append(card);
  card.querySelector('#setSpoiler').addEventListener('change', (e) => { state.spoilers = e.target.checked; saveSpoilers(); updateRing(); render(); });
  card.querySelector('#exportBtn').addEventListener('click', downloadExport);
  card.querySelector('#copyBtn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(exportState(), null, 2)); card.querySelector('#exportStatus').textContent = 'Export JSON copied to the clipboard.'; }
    catch { card.querySelector('#exportStatus').textContent = 'Copy failed — use the Export button instead.'; }
  });
  const importStatus = card.querySelector('#importStatus');
  const doImport = (text) => {
    try { importState(text); updateRing(); render(); }
    catch (err) { importStatus.textContent = `Import failed: ${err.message}`; importStatus.classList.add('err'); }
  };
  card.querySelector('#importBtn').addEventListener('click', () => doImport(card.querySelector('#importText').value));
  card.querySelector('#importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (f) doImport(await f.text());
  });
  card.querySelector('#resetBtn').addEventListener('click', () => {
    resetState(); updateRing(); render();
  });
}

// ---- Router -----------------------------------------------------------------
function render() {
  updateRing();
  document.querySelectorAll('.rail a').forEach((a) => a.classList.remove('active'));
  const hash = location.hash || '#/roadmap';
  const parts = hash.replace(/^#\//, '').split('/');
  const route = parts[0] || 'roadmap';
  const link = document.querySelector(`.rail a[data-view="${route === 'trophy' ? 'trophies' : route}"]`);
  if (link) link.classList.add('active');
  if (route === 'trophies') renderTrophies();
  else if (route === 'trophy') renderTrophy(Number(parts[1]));
  else if (route === 'tracker') renderTracker();
  else if (route === 'sources') renderSources();
  else if (route === 'settings') renderSettings();
  else renderRoadmap();
}

globalSearch.addEventListener('input', () => {
  state.search = globalSearch.value.trim();
  if ((location.hash || '').startsWith('#/trophies')) render();
  else if (state.search) location.hash = '#/trophies';
});
spoilerToggle.addEventListener('change', () => {
  state.spoilers = spoilerToggle.checked; saveSpoilers(); render();
});
window.addEventListener('hashchange', render);
updateRing();
render();
