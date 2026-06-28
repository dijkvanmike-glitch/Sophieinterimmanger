'use strict';

// ── Nep database ────────────────────────────────────────────────────────────

const DB = {
  gebruikers: [
    {
      id: 'eigenaar',
      naam: 'Rijschool De Rijder',
      email: 'eigenaar@rijschool.nl',
      wachtwoord: '123456',
      rol: 'eigenaar'
    },
    {
      id: 'cursist1',
      naam: 'Lisa van Dijk',
      email: 'lisa@email.nl',
      wachtwoord: '123456',
      rol: 'cursist',
      beschikbaarheid: {
        maandag: ['08:00-10:00', '10:00-12:00', '14:00-16:00'],
        dinsdag: ['14:00-16:00', '16:00-18:00'],
        woensdag: [],
        donderdag: ['08:00-10:00'],
        vrijdag: ['10:00-12:00', '14:00-16:00']
      }
    },
    {
      id: 'cursist2',
      naam: 'Tom Bakker',
      email: 'tom@email.nl',
      wachtwoord: '123456',
      rol: 'cursist',
      beschikbaarheid: {
        maandag: ['14:00-16:00', '16:00-18:00'],
        dinsdag: ['08:00-10:00'],
        woensdag: ['10:00-12:00', '14:00-16:00'],
        donderdag: [],
        vrijdag: ['08:00-10:00', '10:00-12:00']
      }
    },
    {
      id: 'cursist3',
      naam: 'Emma Smit',
      email: 'emma@email.nl',
      wachtwoord: '123456',
      rol: 'cursist',
      beschikbaarheid: {
        maandag: ['10:00-12:00'],
        dinsdag: ['10:00-12:00', '14:00-16:00'],
        woensdag: ['08:00-10:00', '16:00-18:00'],
        donderdag: ['14:00-16:00', '16:00-18:00'],
        vrijdag: []
      }
    }
  ],

  lessen: [
    {
      id: 'les1',
      cursistId: 'cursist1',
      datum: vandaagPlus(0),
      start: '09:00',
      eind: '10:00',
      locatie: 'Rijschool Centrum',
      status: 'gepland'
    },
    {
      id: 'les2',
      cursistId: 'cursist2',
      datum: vandaagPlus(0),
      start: '14:00',
      eind: '15:00',
      locatie: 'Rijschool Noord',
      status: 'afgemeld',
      afgemeldDoor: 'cursist2'
    },
    {
      id: 'les3',
      cursistId: 'cursist3',
      datum: vandaagPlus(1),
      start: '10:00',
      eind: '11:00',
      locatie: 'Rijschool Centrum',
      status: 'gepland'
    },
    {
      id: 'les4',
      cursistId: 'cursist1',
      datum: vandaagPlus(2),
      start: '14:00',
      eind: '15:00',
      locatie: 'Rijschool Zuid',
      status: 'gepland'
    }
  ],

  reacties: [
    {
      id: 'r1',
      lesId: 'les2',
      cursistId: 'cursist3',
      tijdstip: '08:42',
      status: 'wachtend'
    }
  ]
};

function vandaagPlus(dagen) {
  const d = new Date();
  d.setDate(d.getDate() + dagen);
  return d.toISOString().slice(0, 10);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── State ───────────────────────────────────────────────────────────────────
let huidigGebruiker = null;

const TIJDVAKKEN = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00'];
const DAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'];
const DAGEN_LABEL = { maandag: 'Maandag', dinsdag: 'Dinsdag', woensdag: 'Woensdag', donderdag: 'Donderdag', vrijdag: 'Vrijdag' };

// ── Hulpfuncties ────────────────────────────────────────────────────────────
function gebruikerById(id) { return DB.gebruikers.find(g => g.id === id); }
function lessenVanCursist(id) { return DB.lessen.filter(l => l.cursistId === id); }
function reactiesOpLes(lesId) { return DB.reacties.filter(r => r.lesId === lesId); }
function openReacties() { return DB.reacties.filter(r => r.status === 'wachtend'); }

function dagVanDatum(iso) {
  const d = new Date(iso + 'T12:00:00');
  const dagen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  return dagen[d.getDay()];
}

function formatDatum(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
}

function cursistBeschikbaarOpLes(cursist, les) {
  const dag = dagVanDatum(les.datum);
  const beschikbaar = cursist.beschikbaarheid[dag] || [];
  return beschikbaar.some(tv => {
    const [tvStart] = tv.split('-');
    return les.start >= tvStart && les.start < tv.split('-')[1];
  });
}

// ── Schermen ────────────────────────────────────────────────────────────────
function toonScherm(id) {
  document.querySelectorAll('.scherm').forEach(s => s.classList.add('verborgen'));
  document.getElementById(id).classList.remove('verborgen');
}

// ── Login ───────────────────────────────────────────────────────────────────
function demoLogin(id) {
  const g = gebruikerById(id);
  if (!g) return;
  huidigGebruiker = g;
  if (g.rol === 'eigenaar') {
    toonScherm('scherm-eigenaar');
    document.getElementById('eigenaar-naam').textContent = g.naam;
    eigenaarTab('overzicht', document.querySelector('#scherm-eigenaar .nav-tab'));
    renderEigenaarOverzicht();
  } else {
    toonScherm('scherm-cursist');
    document.getElementById('cursist-naam').textContent = g.naam.split(' ')[0];
    cursistTab('mijn-lessen', document.querySelector('#scherm-cursist .nav-tab'));
    renderCursistLessen();
  }
}

function inloggen(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const ww = document.getElementById('login-ww').value;
  const g = DB.gebruikers.find(u => u.email === email && u.wachtwoord === ww);
  if (!g) { toonToast('Onbekend e-mailadres of wachtwoord'); return; }
  demoLogin(g.id);
}

function registreren(e) {
  e.preventDefault();
  const naam = document.getElementById('reg-naam').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const ww = document.getElementById('reg-ww').value;
  if (DB.gebruikers.find(u => u.email === email)) { toonToast('Dit e-mailadres is al in gebruik'); return; }
  const nieuw = {
    id: uid(),
    naam, email, wachtwoord: ww,
    rol: 'cursist',
    beschikbaarheid: { maandag: [], dinsdag: [], woensdag: [], donderdag: [], vrijdag: [] }
  };
  DB.gebruikers.push(nieuw);
  toonToast('Account aangemaakt! Je kunt nu inloggen.');
  toonScherm('scherm-login');
}

function uitloggen() {
  huidigGebruiker = null;
  toonScherm('scherm-login');
}

// ── Eigenaar tabs ────────────────────────────────────────────────────────────
function eigenaarTab(naam, knop) {
  document.querySelectorAll('#scherm-eigenaar .nav-tab').forEach(k => k.classList.remove('active'));
  document.querySelectorAll('#scherm-eigenaar .tab-inhoud').forEach(t => t.classList.add('verborgen'));
  if (knop) knop.classList.add('active');
  document.getElementById('e-' + naam).classList.remove('verborgen');
  if (naam === 'overzicht') renderEigenaarOverzicht();
  if (naam === 'lessen') renderLessenLijst();
  if (naam === 'cursisten') renderCursistenLijst();
  if (naam === 'reacties') renderReactiesLijst();
}

// ── Eigenaar: Overzicht ──────────────────────────────────────────────────────
function renderEigenaarOverzicht() {
  const vandaag = new Date().toISOString().slice(0, 10);
  const lessenVandaag = DB.lessen.filter(l => l.datum === vandaag);
  const afmeldingen = DB.lessen.filter(l => l.status === 'afgemeld');
  const openR = openReacties();
  const cursisten = DB.gebruikers.filter(g => g.rol === 'cursist');

  document.getElementById('stat-lessen').textContent = lessenVandaag.length;
  document.getElementById('stat-afmeldingen').textContent = afmeldingen.length;
  document.getElementById('stat-reacties').textContent = openR.length;
  document.getElementById('stat-cursisten').textContent = cursisten.length;

  // Badge
  const badge = document.getElementById('reactie-badge');
  if (openR.length > 0) {
    badge.textContent = openR.length;
    badge.classList.remove('verborgen');
  } else {
    badge.classList.add('verborgen');
  }

  // Vrijgekomen lessen
  const container = document.getElementById('vrijgekomen-lessen');
  const vrijgekomen = DB.lessen.filter(l => l.status === 'afgemeld');
  if (!vrijgekomen.length) {
    container.innerHTML = '<div class="leeg"><div class="leeg__ikoon">✅</div><div class="leeg__tekst">Geen vrijgekomen lessen</div></div>';
    return;
  }
  container.innerHTML = vrijgekomen.map(les => {
    const cursist = gebruikerById(les.cursistId);
    const reacties = reactiesOpLes(les.id);
    return `
      <div class="kaart kaart--klikbaar" onclick="openReactieModal('${les.id}')">
        <div class="kaart__ikoon ikoon--rood">📅</div>
        <div class="kaart__inhoud">
          <div class="kaart__titel">${formatDatum(les.datum)} · ${les.start}–${les.eind}</div>
          <div class="kaart__meta">Afgemeld door: ${cursist?.naam} · ${les.locatie || ''}</div>
          <div class="kaart__meta" style="margin-top:.3rem">${reacties.length} reactie(s) ontvangen</div>
        </div>
        <div class="kaart__acties">
          <span class="chip chip--afgemeld">Vrijgekomen</span>
          <button class="btn btn--primary btn--sm">Bekijk reacties</button>
        </div>
      </div>`;
  }).join('');
}

// ── Eigenaar: Lessen ─────────────────────────────────────────────────────────
function renderLessenLijst() {
  const container = document.getElementById('lessen-lijst');
  const gesorteerd = [...DB.lessen].sort((a, b) => a.datum.localeCompare(b.datum) || a.start.localeCompare(b.start));
  if (!gesorteerd.length) {
    container.innerHTML = '<div class="leeg"><div class="leeg__ikoon">📅</div><div class="leeg__tekst">Nog geen lessen gepland</div></div>';
    return;
  }
  container.innerHTML = gesorteerd.map(les => {
    const cursist = gebruikerById(les.cursistId);
    const chipKlasse = { gepland: 'chip--gepland', afgemeld: 'chip--afgemeld', bezet: 'chip--bezet' }[les.status] || 'chip--gepland';
    const chipTekst = { gepland: 'Gepland', afgemeld: 'Afgemeld', bezet: 'Ingevuld' }[les.status] || les.status;
    return `
      <div class="kaart">
        <div class="kaart__ikoon ikoon--blauw">🚗</div>
        <div class="kaart__inhoud">
          <div class="kaart__titel">${formatDatum(les.datum)} · ${les.start}–${les.eind}</div>
          <div class="kaart__meta">${cursist?.naam} · ${les.locatie || 'Geen locatie'}</div>
        </div>
        <div class="kaart__acties">
          <span class="chip ${chipKlasse}">${chipTekst}</span>
          <button class="btn btn--ghost btn--sm" onclick="verwijderLes('${les.id}')">Verwijderen</button>
        </div>
      </div>`;
  }).join('');
}

function openLesModal() {
  const select = document.getElementById('les-cursist');
  const cursisten = DB.gebruikers.filter(g => g.rol === 'cursist');
  select.innerHTML = cursisten.map(c => `<option value="${c.id}">${c.naam}</option>`).join('');
  document.getElementById('les-datum').value = new Date().toISOString().slice(0, 10);
  document.getElementById('les-modal').classList.remove('verborgen');
}

function lesOpslaan(e) {
  e.preventDefault();
  const les = {
    id: uid(),
    cursistId: document.getElementById('les-cursist').value,
    datum: document.getElementById('les-datum').value,
    start: document.getElementById('les-start').value,
    eind: document.getElementById('les-eind').value,
    locatie: document.getElementById('les-locatie').value.trim(),
    status: 'gepland'
  };
  DB.lessen.push(les);
  sluitModal('les-modal');
  toonToast('Les toegevoegd!');
  renderLessenLijst();
}

function verwijderLes(id) {
  if (!confirm('Weet je zeker dat je deze les wilt verwijderen?')) return;
  const idx = DB.lessen.findIndex(l => l.id === id);
  if (idx >= 0) DB.lessen.splice(idx, 1);
  toonToast('Les verwijderd');
  renderLessenLijst();
}

// ── Eigenaar: Cursisten ──────────────────────────────────────────────────────
function renderCursistenLijst() {
  const container = document.getElementById('cursisten-lijst');
  const cursisten = DB.gebruikers.filter(g => g.rol === 'cursist');
  container.innerHTML = cursisten.map(c => {
    const aantalLessen = lessenVanCursist(c.id).length;
    return `
      <div class="kaart">
        <div class="kaart__ikoon ikoon--blauw">👤</div>
        <div class="kaart__inhoud">
          <div class="kaart__titel">${c.naam}</div>
          <div class="kaart__meta">${c.email} · ${aantalLessen} les(sen) gepland</div>
        </div>
      </div>`;
  }).join('');
}

// ── Eigenaar: Reacties ───────────────────────────────────────────────────────
function renderReactiesLijst() {
  const container = document.getElementById('reacties-lijst');
  const vrijgekomen = DB.lessen.filter(l => l.status === 'afgemeld');
  if (!vrijgekomen.length) {
    container.innerHTML = '<div class="leeg"><div class="leeg__ikoon">📭</div><div class="leeg__tekst">Geen open reacties</div></div>';
    return;
  }
  container.innerHTML = vrijgekomen.map(les => {
    const cursist = gebruikerById(les.cursistId);
    const reacties = reactiesOpLes(les.id);
    return `
      <div class="kaart" style="flex-direction:column;align-items:flex-start">
        <div style="display:flex;align-items:center;gap:.75rem;width:100%">
          <div class="kaart__ikoon ikoon--rood">📅</div>
          <div class="kaart__inhoud">
            <div class="kaart__titel">${formatDatum(les.datum)} · ${les.start}–${les.eind}</div>
            <div class="kaart__meta">Afgemeld door: ${cursist?.naam}</div>
          </div>
        </div>
        ${reacties.length === 0
          ? '<p style="color:var(--grijs-400);font-size:.85rem;margin-top:.75rem;padding-left:.5rem">Nog geen reacties ontvangen</p>'
          : reacties.map(r => {
              const rc = gebruikerById(r.cursistId);
              return `
                <div class="reactie-kaart" style="width:100%;margin-top:.6rem">
                  <div>
                    <div class="reactie-naam">👤 ${rc?.naam}</div>
                    <div class="reactie-tijd">Gereageerd om ${r.tijdstip}</div>
                  </div>
                  ${r.status === 'wachtend'
                    ? `<div style="display:flex;gap:.5rem">
                        <button class="btn btn--groen btn--sm" onclick="reactieGoedkeuren('${r.id}','${les.id}')">Accepteren</button>
                        <button class="btn btn--ghost btn--sm" onclick="reactieAfwijzen('${r.id}')">Afwijzen</button>
                      </div>`
                    : `<span class="chip ${r.status === 'geaccepteerd' ? 'chip--bezet' : 'chip--afgemeld'}">${r.status === 'geaccepteerd' ? 'Geaccepteerd' : 'Afgewezen'}</span>`
                  }
                </div>`;
            }).join('')
        }
      </div>`;
  }).join('');
}

function openReactieModal(lesId) {
  const les = DB.lessen.find(l => l.id === lesId);
  const reacties = reactiesOpLes(lesId);
  const container = document.getElementById('reactie-modal-inhoud');

  container.innerHTML = `
    <div style="margin-bottom:1rem">
      <div style="font-weight:600">${formatDatum(les.datum)} · ${les.start}–${les.eind}</div>
      <div style="color:var(--grijs-600);font-size:.85rem">${les.locatie || ''}</div>
    </div>
    ${reacties.length === 0
      ? '<div class="leeg"><div class="leeg__ikoon">📭</div><div class="leeg__tekst">Nog geen reacties</div></div>'
      : reacties.map(r => {
          const rc = gebruikerById(r.cursistId);
          return `
            <div class="reactie-kaart">
              <div>
                <div class="reactie-naam">👤 ${rc?.naam}</div>
                <div class="reactie-tijd">Gereageerd om ${r.tijdstip}</div>
              </div>
              ${r.status === 'wachtend'
                ? `<div style="display:flex;gap:.5rem">
                    <button class="btn btn--groen btn--sm" onclick="reactieGoedkeuren('${r.id}','${lesId}');sluitModal('reactie-modal')">Accepteren</button>
                    <button class="btn btn--ghost btn--sm" onclick="reactieAfwijzen('${r.id}');sluitModal('reactie-modal')">Afwijzen</button>
                  </div>`
                : `<span class="chip ${r.status === 'geaccepteerd' ? 'chip--bezet' : 'chip--afgemeld'}">${r.status === 'geaccepteerd' ? 'Geaccepteerd' : 'Afgewezen'}</span>`
              }
            </div>`;
        }).join('')
    }`;
  document.getElementById('reactie-modal').classList.remove('verborgen');
}

function reactieGoedkeuren(reactieId, lesId) {
  const reactie = DB.reacties.find(r => r.id === reactieId);
  if (!reactie) return;
  reactie.status = 'geaccepteerd';

  // Andere reacties afwijzen
  DB.reacties.filter(r => r.lesId === lesId && r.id !== reactieId).forEach(r => r.status = 'afgewezen');

  // Les bijwerken
  const les = DB.lessen.find(l => l.id === lesId);
  if (les) {
    les.status = 'bezet';
    les.cursistId = reactie.cursistId;
  }

  toonToast(`✅ ${gebruikerById(reactie.cursistId)?.naam} heeft de les gekregen!`);
  renderEigenaarOverzicht();
  renderReactiesLijst();
}

function reactieAfwijzen(reactieId) {
  const reactie = DB.reacties.find(r => r.id === reactieId);
  if (reactie) reactie.status = 'afgewezen';
  toonToast('Reactie afgewezen');
  renderReactiesLijst();
}

// ── Cursist tabs ─────────────────────────────────────────────────────────────
function cursistTab(naam, knop) {
  document.querySelectorAll('#scherm-cursist .nav-tab').forEach(k => k.classList.remove('active'));
  document.querySelectorAll('#scherm-cursist .tab-inhoud').forEach(t => t.classList.add('verborgen'));
  if (knop) knop.classList.add('active');
  document.getElementById('c-' + naam).classList.remove('verborgen');
  if (naam === 'mijn-lessen') renderCursistLessen();
  if (naam === 'beschikbaarheid') renderBeschikbaarheid();
  if (naam === 'vrije-plekken') renderVrijePlekken();
}

// ── Cursist: Mijn lessen ─────────────────────────────────────────────────────
function renderCursistLessen() {
  const container = document.getElementById('cursist-lessen-lijst');
  const mijnLessen = lessenVanCursist(huidigGebruiker.id)
    .sort((a, b) => a.datum.localeCompare(b.datum) || a.start.localeCompare(b.start));

  if (!mijnLessen.length) {
    container.innerHTML = '<div class="leeg"><div class="leeg__ikoon">📅</div><div class="leeg__tekst">Je hebt nog geen lessen gepland</div></div>';
    return;
  }

  container.innerHTML = mijnLessen.map(les => {
    const isAfgemeld = les.status === 'afgemeld';
    return `
      <div class="kaart">
        <div class="kaart__ikoon ${isAfgemeld ? 'ikoon--rood' : 'ikoon--blauw'}">🚗</div>
        <div class="kaart__inhoud">
          <div class="kaart__titel">${formatDatum(les.datum)} · ${les.start}–${les.eind}</div>
          <div class="kaart__meta">${les.locatie || 'Geen locatie'}</div>
        </div>
        <div class="kaart__acties">
          ${!isAfgemeld
            ? `<button class="btn btn--gevaar btn--sm" onclick="afmelden('${les.id}')">Afmelden</button>`
            : `<span class="chip chip--afgemeld">Afgemeld</span>`
          }
        </div>
      </div>`;
  }).join('');
}

function afmelden(lesId) {
  if (!confirm('Weet je zeker dat je je wilt afmelden voor deze les?')) return;
  const les = DB.lessen.find(l => l.id === lesId);
  if (!les) return;
  les.status = 'afgemeld';
  les.afgemeldDoor = huidigGebruiker.id;

  // Stuur "melding" naar beschikbare cursisten
  const dag = dagVanDatum(les.datum);
  const beschikbareCursisten = DB.gebruikers.filter(g =>
    g.rol === 'cursist' &&
    g.id !== huidigGebruiker.id &&
    cursistBeschikbaarOpLes(g, les)
  );

  toonToast(`Je bent afgemeld. ${beschikbareCursisten.length} cursist(en) ontvangen een bericht.`);
  renderCursistLessen();
  updateVrijeBadge();
}

// ── Cursist: Beschikbaarheid ─────────────────────────────────────────────────
function renderBeschikbaarheid() {
  const container = document.getElementById('beschikbaarheid-grid');
  const beschikbaarheid = huidigGebruiker.beschikbaarheid;

  container.innerHTML = DAGEN.map(dag => {
    const actief = (beschikbaarheid[dag] || []);
    return `
      <div class="dag-rij">
        <div class="dag-rij__header">
          <span class="dag-naam">${DAGEN_LABEL[dag]}</span>
          <button class="dag-toggle ${actief.length > 0 ? 'aan' : ''}" onclick="dagToggle(this, '${dag}')" data-dag="${dag}"></button>
          <span style="font-size:.82rem;color:var(--grijs-600)">${actief.length > 0 ? 'Beschikbaar' : 'Niet beschikbaar'}</span>
        </div>
        <div class="tijdvakken" id="tijdvakken-${dag}">
          ${TIJDVAKKEN.map(tv => `
            <button class="tijdvak-btn ${actief.includes(tv) ? 'geselecteerd' : ''}"
              onclick="tijdvakToggle(this, '${dag}', '${tv}')"
              data-dag="${dag}" data-tv="${tv}">
              ${tv}
            </button>`).join('')}
        </div>
      </div>`;
  }).join('');
}

function dagToggle(knop, dag) {
  knop.classList.toggle('aan');
  const label = knop.nextElementSibling;
  if (!knop.classList.contains('aan')) {
    huidigGebruiker.beschikbaarheid[dag] = [];
    document.querySelectorAll(`[data-dag="${dag}"].tijdvak-btn`).forEach(b => b.classList.remove('geselecteerd'));
    label.textContent = 'Niet beschikbaar';
  } else {
    label.textContent = 'Beschikbaar';
  }
}

function tijdvakToggle(knop, dag, tv) {
  knop.classList.toggle('geselecteerd');
  const lijst = huidigGebruiker.beschikbaarheid[dag] || [];
  if (knop.classList.contains('geselecteerd')) {
    if (!lijst.includes(tv)) lijst.push(tv);
  } else {
    const idx = lijst.indexOf(tv);
    if (idx >= 0) lijst.splice(idx, 1);
  }
  huidigGebruiker.beschikbaarheid[dag] = lijst;
  // Toggle knop bijwerken
  const dagToggleKnop = document.querySelector(`.dag-toggle[data-dag="${dag}"]`);
  if (dagToggleKnop) {
    const heeftTijdvakken = lijst.length > 0;
    dagToggleKnop.classList.toggle('aan', heeftTijdvakken);
    dagToggleKnop.nextElementSibling.textContent = heeftTijdvakken ? 'Beschikbaar' : 'Niet beschikbaar';
  }
}

function beschikbaarheidOpslaan() {
  toonToast('✅ Beschikbaarheid opgeslagen!');
}

// ── Cursist: Vrije plekken ───────────────────────────────────────────────────
function renderVrijePlekken() {
  const container = document.getElementById('vrije-plekken-lijst');
  const vrijeLessen = DB.lessen.filter(l =>
    l.status === 'afgemeld' &&
    l.cursistId !== huidigGebruiker.id &&
    cursistBeschikbaarOpLes(huidigGebruiker, l)
  );

  updateVrijeBadge();

  if (!vrijeLessen.length) {
    container.innerHTML = '<div class="leeg"><div class="leeg__ikoon">🎉</div><div class="leeg__tekst">Geen vrije plekken op dit moment</div></div>';
    return;
  }

  container.innerHTML = vrijeLessen.map(les => {
    const bestaandeReactie = DB.reacties.find(r => r.lesId === les.id && r.cursistId === huidigGebruiker.id);
    return `
      <div class="melding">
        <div class="melding__ikoon">📢</div>
        <div class="melding__tekst" style="flex:1">
          <strong>Er is een rijles vrijgekomen!</strong>
          ${formatDatum(les.datum)} van ${les.start} tot ${les.eind}<br>
          📍 ${les.locatie || 'Geen locatie'}
        </div>
        ${bestaandeReactie
          ? `<span class="chip chip--wachten">Gereageerd</span>`
          : `<button class="btn btn--primary btn--sm" onclick="reageerOpLes('${les.id}')">Ik wil deze les!</button>`
        }
      </div>`;
  }).join('');
}

function reageerOpLes(lesId) {
  const nu = new Date();
  const tijdstip = `${String(nu.getHours()).padStart(2,'0')}:${String(nu.getMinutes()).padStart(2,'0')}`;
  DB.reacties.push({
    id: uid(),
    lesId,
    cursistId: huidigGebruiker.id,
    tijdstip,
    status: 'wachtend'
  });
  toonToast('✅ Je reactie is verstuurd! De rijschool neemt een beslissing.');
  renderVrijePlekken();
}

function updateVrijeBadge() {
  if (!huidigGebruiker || huidigGebruiker.rol !== 'cursist') return;
  const aantal = DB.lessen.filter(l =>
    l.status === 'afgemeld' &&
    l.cursistId !== huidigGebruiker.id &&
    cursistBeschikbaarOpLes(huidigGebruiker, l)
  ).length;
  const badge = document.getElementById('vrije-badge');
  if (badge) {
    if (aantal > 0) { badge.textContent = aantal; badge.classList.remove('verborgen'); }
    else { badge.classList.add('verborgen'); }
  }
}

// ── Modals ───────────────────────────────────────────────────────────────────
function sluitModal(id) {
  document.getElementById(id).classList.add('verborgen');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('verborgen');
  });
});

// ── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function toonToast(tekst) {
  const toast = document.getElementById('toast');
  toast.textContent = tekst;
  toast.classList.remove('verborgen');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('verborgen'), 3500);
}

// ── Start ────────────────────────────────────────────────────────────────────
toonScherm('scherm-login');
