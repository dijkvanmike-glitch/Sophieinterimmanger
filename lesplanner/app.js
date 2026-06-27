'use strict';

// ── Storage ────────────────────────────────────────────────────────────────
const STORAGE_KEY_LES = 'lesplanner_lessen';
const STORAGE_KEY_TAAK = 'lesplanner_taken';

function loadLessen() { return JSON.parse(localStorage.getItem(STORAGE_KEY_LES) || '[]'); }
function saveLessen(data) { localStorage.setItem(STORAGE_KEY_LES, JSON.stringify(data)); }
function loadTaken() { return JSON.parse(localStorage.getItem(STORAGE_KEY_TAAK) || '[]'); }
function saveTaken(data) { localStorage.setItem(STORAGE_KEY_TAAK, JSON.stringify(data)); }

// ── State ──────────────────────────────────────────────────────────────────
let lessen = loadLessen();
let taken = loadTaken();
let currentWeekOffset = 0;
let currentDagOffset = 0;
let editingLesId = null;
let editingTaakId = null;

// ── Utils ──────────────────────────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function getMaandag(offset = 0) {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function formatDeadline(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isExpired(iso) {
  return new Date(iso + 'T23:59:59') < new Date();
}

const DAYS_NL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];

// ── Views ──────────────────────────────────────────────────────────────────
const views = document.querySelectorAll('.view');
const viewBtns = document.querySelectorAll('.view-btn');

function showView(name) {
  views.forEach(v => v.classList.toggle('hidden', v.id !== 'view-' + name));
  viewBtns.forEach(b => b.classList.toggle('active', b.dataset.view === name));
  if (name === 'week') renderWeek();
  if (name === 'dag') renderDag();
  if (name === 'taken') renderTaken();
}

viewBtns.forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));

// ── Week view ──────────────────────────────────────────────────────────────
const weekLabel = document.getElementById('weekLabel');
const weekGrid = document.getElementById('weekGrid');

function renderWeek() {
  const maandag = getMaandag(currentWeekOffset);
  const zondag = new Date(maandag); zondag.setDate(maandag.getDate() + 4);
  weekLabel.textContent = `${formatDate(maandag)} – ${formatDate(zondag)}`;

  weekGrid.innerHTML = '';
  const today = toISO(new Date());

  for (let i = 0; i < 5; i++) {
    const day = new Date(maandag); day.setDate(maandag.getDate() + i);
    const iso = toISO(day);
    const dayLessen = lessen.filter(l => l.datum === iso).sort((a, b) => a.start.localeCompare(b.start));

    const col = document.createElement('div');
    col.className = 'week-day';
    col.innerHTML = `
      <div class="week-day__header${iso === today ? ' today' : ''}">
        ${DAYS_NL[i]} <span style="font-weight:400;opacity:.75">${day.getDate()}/${day.getMonth() + 1}</span>
      </div>
      <div class="week-day__lessons">
        ${dayLessen.length
          ? dayLessen.map(l => `
            <div class="les-card" data-id="${l.id}">
              <div class="les-card__vak">${l.vak}</div>
              <div class="les-card__tijd">${l.start}–${l.eind}</div>
              ${l.lokaal ? `<div class="les-card__lokaal">${l.lokaal}</div>` : ''}
            </div>`).join('')
          : '<div class="empty-msg">Geen lessen</div>'
        }
      </div>`;
    col.querySelectorAll('.les-card').forEach(card => {
      card.addEventListener('click', () => openLesModal(card.dataset.id));
    });
    weekGrid.appendChild(col);
  }
}

document.getElementById('prevWeek').addEventListener('click', () => { currentWeekOffset--; renderWeek(); });
document.getElementById('nextWeek').addEventListener('click', () => { currentWeekOffset++; renderWeek(); });

// ── Dag view ───────────────────────────────────────────────────────────────
const dagLabel = document.getElementById('dagLabel');
const dagList = document.getElementById('dagList');

function getCurrentDag() {
  const d = new Date();
  d.setDate(d.getDate() + currentDagOffset);
  return d;
}

function renderDag() {
  const d = getCurrentDag();
  const iso = toISO(d);
  dagLabel.textContent = d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const dayLessen = lessen.filter(l => l.datum === iso).sort((a, b) => a.start.localeCompare(b.start));
  if (!dayLessen.length) {
    dagList.innerHTML = '<div class="empty-msg" style="padding:2rem 0;text-align:center">Geen lessen op deze dag</div>';
    return;
  }
  dagList.innerHTML = dayLessen.map(l => `
    <div class="dag-les-card" data-id="${l.id}">
      <div class="dag-les-card__tijd">${l.start}–${l.eind}</div>
      <div>
        <div class="dag-les-card__vak">${l.vak}</div>
        ${l.lokaal ? `<div class="dag-les-card__meta">Lokaal: ${l.lokaal}</div>` : ''}
        ${l.notitie ? `<div class="dag-les-card__notitie">${l.notitie}</div>` : ''}
      </div>
    </div>`).join('');
  dagList.querySelectorAll('.dag-les-card').forEach(card => {
    card.addEventListener('click', () => openLesModal(card.dataset.id));
  });
}

document.getElementById('prevDag').addEventListener('click', () => { currentDagOffset--; renderDag(); });
document.getElementById('nextDag').addEventListener('click', () => { currentDagOffset++; renderDag(); });

// ── Taken view ─────────────────────────────────────────────────────────────
const takenList = document.getElementById('takenList');

function renderTaken() {
  const sorted = [...taken].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.deadline.localeCompare(b.deadline);
  });
  if (!sorted.length) {
    takenList.innerHTML = '<div class="empty-msg" style="padding:2rem 0;text-align:center">Geen taken</div>';
    return;
  }
  takenList.innerHTML = sorted.map(t => `
    <div class="taak-card${t.done ? ' done' : ''}${!t.done && isExpired(t.deadline) ? ' taak-expired' : ''}" data-id="${t.id}">
      <div class="taak-card__check" data-check="${t.id}"></div>
      <div class="taak-card__naam">${t.naam}</div>
      <div class="taak-card__deadline">${formatDeadline(t.deadline)}</div>
      <span class="badge badge--${t.prioriteit}">${t.prioriteit}</span>
    </div>`).join('');

  takenList.querySelectorAll('.taak-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.dataset.check) { toggleTaak(e.target.dataset.check); return; }
      openTaakModal(card.dataset.id);
    });
  });
  takenList.querySelectorAll('[data-check]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); toggleTaak(btn.dataset.check); });
  });
}

function toggleTaak(id) {
  const t = taken.find(x => x.id === id);
  if (t) { t.done = !t.done; saveTaken(taken); renderTaken(); }
}

// ── Les modal ──────────────────────────────────────────────────────────────
const lesModal = document.getElementById('lesModal');
const lesForm = document.getElementById('lesForm');
const deleteLesBtn = document.getElementById('deleteLesBtn');

function openLesModal(id = null) {
  editingLesId = id;
  const l = id ? lessen.find(x => x.id === id) : null;
  document.getElementById('modalTitle').textContent = l ? 'Les bewerken' : 'Les toevoegen';
  document.getElementById('lesVak').value = l?.vak || '';
  document.getElementById('lesDatum').value = l?.datum || toISO(new Date());
  document.getElementById('lesStart').value = l?.start || '08:00';
  document.getElementById('lesEind').value = l?.eind || '09:00';
  document.getElementById('lesLokaal').value = l?.lokaal || '';
  document.getElementById('lesNotitie').value = l?.notitie || '';
  deleteLesBtn.style.display = l ? '' : 'none';
  lesModal.classList.remove('hidden');
}

document.getElementById('addLesBtn').addEventListener('click', () => openLesModal());
document.getElementById('closeLesModal').addEventListener('click', () => lesModal.classList.add('hidden'));
lesModal.addEventListener('click', e => { if (e.target === lesModal) lesModal.classList.add('hidden'); });

lesForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    id: editingLesId || uid(),
    vak: document.getElementById('lesVak').value.trim(),
    datum: document.getElementById('lesDatum').value,
    start: document.getElementById('lesStart').value,
    eind: document.getElementById('lesEind').value,
    lokaal: document.getElementById('lesLokaal').value.trim(),
    notitie: document.getElementById('lesNotitie').value.trim(),
  };
  if (editingLesId) {
    const idx = lessen.findIndex(x => x.id === editingLesId);
    lessen[idx] = data;
  } else {
    lessen.push(data);
  }
  saveLessen(lessen);
  lesModal.classList.add('hidden');
  refreshActiveView();
});

deleteLesBtn.addEventListener('click', () => {
  lessen = lessen.filter(x => x.id !== editingLesId);
  saveLessen(lessen);
  lesModal.classList.add('hidden');
  refreshActiveView();
});

// ── Taak modal ─────────────────────────────────────────────────────────────
const taakModal = document.getElementById('taakModal');
const taakForm = document.getElementById('taakForm');
const deleteTaakBtn = document.getElementById('deleteTaakBtn');

function openTaakModal(id = null) {
  editingTaakId = id;
  const t = id ? taken.find(x => x.id === id) : null;
  document.getElementById('taakModalTitle').textContent = t ? 'Taak bewerken' : 'Taak toevoegen';
  document.getElementById('taakNaam').value = t?.naam || '';
  document.getElementById('taakDeadline').value = t?.deadline || toISO(new Date());
  document.getElementById('taakPrioriteit').value = t?.prioriteit || 'middel';
  document.getElementById('taakNotitie').value = t?.notitie || '';
  deleteTaakBtn.style.display = t ? '' : 'none';
  taakModal.classList.remove('hidden');
}

document.getElementById('addTaakBtn').addEventListener('click', () => openTaakModal());
document.getElementById('closeTaakModal').addEventListener('click', () => taakModal.classList.add('hidden'));
taakModal.addEventListener('click', e => { if (e.target === taakModal) taakModal.classList.add('hidden'); });

taakForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    id: editingTaakId || uid(),
    naam: document.getElementById('taakNaam').value.trim(),
    deadline: document.getElementById('taakDeadline').value,
    prioriteit: document.getElementById('taakPrioriteit').value,
    notitie: document.getElementById('taakNotitie').value.trim(),
    done: editingTaakId ? (taken.find(x => x.id === editingTaakId)?.done || false) : false,
  };
  if (editingTaakId) {
    const idx = taken.findIndex(x => x.id === editingTaakId);
    taken[idx] = data;
  } else {
    taken.push(data);
  }
  saveTaken(taken);
  taakModal.classList.add('hidden');
  renderTaken();
});

deleteTaakBtn.addEventListener('click', () => {
  taken = taken.filter(x => x.id !== editingTaakId);
  saveTaken(taken);
  taakModal.classList.add('hidden');
  renderTaken();
});

// ── Refresh ────────────────────────────────────────────────────────────────
function refreshActiveView() {
  const active = document.querySelector('.view-btn.active')?.dataset.view;
  if (active === 'week') renderWeek();
  else if (active === 'dag') renderDag();
  else if (active === 'taken') renderTaken();
}

// ── Init ───────────────────────────────────────────────────────────────────
showView('week');
