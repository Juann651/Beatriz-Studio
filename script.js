// ── Constants ────────────────────────────────────────────────
const DB_KEY   = 'bgstudio_v1_bookings';
const ADMIN_PW = 'beatriz2025';

const SVCS = [
  { id: 'gel', name: 'Unhas de Gel',           icon: '', dur: '90 min', price: 'R$ 120,00' },
  { id: 'lix', name: 'Lixamento de Unhas',     icon: '', dur: '30 min', price: 'R$ 25,00'  },
  { id: 'cut', name: 'Remoção de Cutículas',   icon: '', dur: '20 min', price: 'R$ 20,00'  },
  { id: 'hid', name: 'Hidratação Profunda',    icon: '', dur: '60 min', price: 'R$ 55,00'  },
  { id: 'esm', name: 'Esmaltação Tradicional', icon: '', dur: '40 min', price: 'R$ 30,00'  },
  { id: 'gsl', name: 'Esmaltação em Gel',      icon: '', dur: '60 min', price: 'R$ 65,00'  },
];

const SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
];

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ── Database (localStorage) ──────────────────────────────────
async function dbLoad() {
  try {
    const r = localStorage.getItem(DB_KEY);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}

async function dbSave(list) {
  localStorage.setItem(DB_KEY, JSON.stringify(list));
}

// ── Helpers ──────────────────────────────────────────────────
function dKey(d) {
  return d instanceof Date ? d.toISOString().slice(0, 10) : d;
}

function genId() {
  return 'BG-' + String(Math.floor(1000 + Math.random() * 9000));
}

async function bookedOn(dateStr) {
  const all = await dbLoad();
  return all
    .filter(b => b.date === dateStr && b.status !== 'cancelled')
    .map(b => b.time);
}

// ── Booking State ────────────────────────────────────────────
let S = { svc: null, date: null, time: null };
let calY, calM;
(function () {
  const n = new Date();
  calY = n.getFullYear();
  calM = n.getMonth();
})();

// ── Step Navigation ──────────────────────────────────────────
function goStep(n) {
  if (n === 2 && !S.svc) return;
  if (n === 3 && (!S.date || !S.time)) return;

  [1, 2, 3, 4].forEach(i => {
    document.getElementById('p' + i).classList.toggle('active', i === n);
    const si = document.getElementById('si' + i);
    si.classList.remove('active', 'done');
    if (i === n) si.classList.add('active');
    else if (i < n) si.classList.add('done');
  });

  if (n === 3) drawSumMini();
  document.getElementById('agendar').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Service Cards ────────────────────────────────────────────
function initSvcs() {
  document.getElementById('svcGrid').innerHTML = SVCS.map(s => `
    <div class="svc-card" id="sc-${s.id}" onclick="pickSvc('${s.id}')">
      <span class="svc-icon2">${s.icon}</span>
      <div class="svc-name">${s.name}</div>
      <div class="svc-dur">⏱ ${s.dur}</div>
      <div class="svc-price">${s.price}</div>
    </div>`).join('');
}

function pickSvc(id) {
  S.svc = SVCS.find(s => s.id === id);
  document.querySelectorAll('.svc-card').forEach(c => c.classList.remove('sel'));
  document.getElementById('sc-' + id).classList.add('sel');
  document.getElementById('btn12').disabled = false;
}

// ── Calendar ─────────────────────────────────────────────────
async function drawCal() {
  document.getElementById('calTitleTxt').textContent = MONTHS[calM] + ' ' + calY;
  const grid = document.getElementById('calGrid');
  grid.innerHTML = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    .map(d => `<div class="cal-dn">${d}</div>`).join('');

  const all = await dbLoad();
  const byDate = {};
  all
    .filter(b => b.status !== 'cancelled')
    .forEach(b => {
      if (!byDate[b.date]) byDate[b.date] = [];
      byDate[b.date].push(b.time);
    });

  const first = new Date(calY, calM, 1);
  const dow = first.getDay();
  const dim = new Date(calY, calM + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dow; i++) {
    grid.innerHTML += `<div class="cal-d emp"></div>`;
  }

  for (let d = 1; d <= dim; d++) {
    const dt = new Date(calY, calM, d);
    const dk = dKey(dt);
    const past = dt < today;
    const sun = dt.getDay() === 0;
    const bkd = (byDate[dk] || []).length;
    const full = bkd >= SLOTS.length;
    const isTd = dt.getTime() === today.getTime();
    const isPk = S.date && dKey(S.date) === dk;

    let cls = 'cal-d';
    if (past || sun || full) cls += ' dis';
    if (isTd) cls += ' today';
    if (isPk) cls += ' picked';
    if (!past && !sun && bkd > 0 && !full) cls += ' has-dot';

    grid.innerHTML += `<div class="${cls}" onclick="pickDate(${calY},${calM},${d})">${d}</div>`;
  }
}

async function pickDate(y, m, d) {
  S.date = new Date(y, m, d);
  S.time = null;
  await drawCal();
  await drawSlots();
  document.getElementById('btn23').disabled = true;
}

// ── Slots ────────────────────────────────────────────────────
async function drawSlots() {
  const hd = document.getElementById('slotsHd');
  const gr = document.getElementById('slotsGrid');

  if (!S.date) {
    gr.innerHTML = '<div class="slots-empty">👆 Escolha uma data no calendário</div>';
    return;
  }

  const dk = dKey(S.date);
  const bkd = await bookedOn(dk);
  hd.textContent = S.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  if (SLOTS.every(s => bkd.includes(s))) {
    gr.innerHTML = '<div class="slots-empty">😔 Sem horários disponíveis neste dia</div>';
    return;
  }

  gr.innerHTML = SLOTS.map(s => {
    const isB = bkd.includes(s);
    const isP = S.time === s;
    return `<button class="slot-b${isB ? ' bkd' : ''}${isP ? ' picked-slot' : ''}" ${isB ? 'disabled' : ''} onclick="pickSlot('${s}')">${s}</button>`;
  }).join('');
}

function pickSlot(t) {
  S.time = t;
  document.querySelectorAll('.slot-b').forEach(b => b.classList.toggle('picked-slot', b.textContent === t));
  document.getElementById('btn23').disabled = false;
}

// Calendar navigation
document.getElementById('prevM').onclick = async () => {
  calM--;
  if (calM < 0) { calM = 11; calY--; }
  await drawCal();
};

document.getElementById('nextM').onclick = async () => {
  calM++;
  if (calM > 11) { calM = 0; calY++; }
  await drawCal();
};

// ── Summary Mini ─────────────────────────────────────────────
function drawSumMini() {
  const dt = S.date?.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) || '';
  document.getElementById('sumMini').innerHTML = `
    <span>${S.svc?.icon} <strong>${S.svc?.name}</strong></span>
    <span>💰 <strong>${S.svc?.price}</strong></span>
    <span>📅 <strong>${dt}</strong></span>
    <span>🕐 <strong>${S.time}</strong></span>`;
}

// ── Confirm Booking ──────────────────────────────────────────
async function doConfirm() {
  const name  = document.getElementById('cName').value.trim();
  const phone = document.getElementById('cPhone').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const notes = document.getElementById('cNotes').value.trim();

  if (!name)  { alert('Por favor informe seu nome.');     return; }
  if (!phone) { alert('Por favor informe seu telefone.'); return; }

  const bkd = await bookedOn(dKey(S.date));
  if (bkd.includes(S.time)) {
    alert('Esse horário acabou de ser ocupado! Escolha outro.');
    goStep(2);
    return;
  }

  const id = genId();
  const b = {
    id,
    service:     S.svc.name,
    serviceIcon: S.svc.icon,
    price:       S.svc.price,
    date:        dKey(S.date),
    time:        S.time,
    name, phone, email, notes,
    status:      'pending',
    createdAt:   new Date().toISOString(),
  };

  const all = await dbLoad();
  all.push(b);
  await dbSave(all);

  const dateDisp = S.date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  document.getElementById('confDetails').innerHTML = `
    <div class="conf-row"><span>Serviço</span><span>${S.svc.icon} ${S.svc.name}</span></div>
    <div class="conf-row"><span>Valor</span><span>${S.svc.price}</span></div>
    <div class="conf-row"><span>Data</span><span>${dateDisp}</span></div>
    <div class="conf-row"><span>Horário</span><span>${S.time}</span></div>
    <div class="conf-row"><span>Nome</span><span>${name}</span></div>
    <div class="conf-row"><span>Telefone</span><span>${phone}</span></div>
    <div class="conf-row"><span>Código</span><span><span class="conf-code">${id}</span></span></div>`;

  goStep(4);
}

function resetFlow() {
  S = { svc: null, date: null, time: null };
  ['cName', 'cPhone', 'cEmail', 'cNotes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.querySelectorAll('.svc-card').forEach(c => c.classList.remove('sel'));
  document.getElementById('btn12').disabled = true;
  goStep(1);
}

// ── Lookup ───────────────────────────────────────────────────
async function doLookup() {
  const code = document.getElementById('lkCode').value.trim().toUpperCase();
  const el   = document.getElementById('lkResult');
  el.style.display = 'block';

  if (!code) {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }

  const all = await dbLoad();
  const b   = all.find(x => x.id === code);

  if (!b) {
    el.innerHTML = `<div style="background:#fee2e2;border-radius:9px;padding:.7rem 1rem;font-size:.83rem;color:#991b1b">❌ Código não encontrado.</div>`;
    return;
  }

  const sMap  = { pending: 'st-pending', confirmed: 'st-confirmed', done: 'st-done', cancelled: 'st-cancelled' };
  const sLabel = { pending: 'Pendente', confirmed: 'Confirmado', done: 'Concluído', cancelled: 'Cancelado' };

  el.innerHTML = `
    <div style="background:var(--rose-pale);border:1.5px solid var(--border);border-radius:12px;padding:1rem;font-size:.84rem;display:flex;flex-direction:column;gap:.4rem">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong style="color:var(--ink)">${b.serviceIcon} ${b.service}</strong>
        <span class="bk-badge ${sMap[b.status]}">${sLabel[b.status]}</span>
      </div>
      <div style="color:var(--muted)">📅 ${b.date} às ${b.time}</div>
      <div style="color:var(--muted)">👤 ${b.name} · 📱 ${b.phone}</div>
      ${b.price ? `<div style="color:var(--rose-deep);font-weight:600">💰 ${b.price}</div>` : ''}
    </div>`;
}

// ── Admin Panel ──────────────────────────────────────────────
let admAuthed = false;
let admFilt   = 'all';

function openAdm()  { document.getElementById('admOverlay').classList.add('open'); if (admAuthed) renderAdmFull(); }
function closeAdm() { document.getElementById('admOverlay').classList.remove('open'); }
function closeAdmBg(e) { if (e.target === document.getElementById('admOverlay')) closeAdm(); }

function checkPw() {
  if (document.getElementById('admPw').value === ADMIN_PW) {
    admAuthed = true;
    document.getElementById('admLogin').style.display = 'none';
    document.getElementById('admBody').style.display  = 'flex';
    renderAdmFull();
  } else {
    document.getElementById('admErr').style.display = 'block';
  }
}

async function renderAdmFull() {
  const all   = await dbLoad();
  const today = dKey(new Date());

  document.getElementById('admStats').innerHTML = `
    <div class="adm-stat"><div class="asn">${all.length}</div><div class="asl">Total</div></div>
    <div class="adm-stat"><div class="asn">${all.filter(b => b.status === 'pending').length}</div><div class="asl">Pendentes</div></div>
    <div class="adm-stat"><div class="asn">${all.filter(b => b.date === today && b.status !== 'cancelled').length}</div><div class="asl">Hoje</div></div>`;

  renderAdm();
}

async function renderAdm() {
  const all = await dbLoad();
  const q   = (document.getElementById('admSearch')?.value || '').toLowerCase();

  let list = all
    .filter(b => {
      if (admFilt !== 'all' && b.status !== admFilt) return false;
      if (q && !b.name.toLowerCase().includes(q) && !b.id.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => a.date === b.date
      ? a.time.localeCompare(b.time)
      : a.date.localeCompare(b.date));

  const el = document.getElementById('admList');

  if (!list.length) {
    el.innerHTML = `<div class="adm-empty"><span>📭</span>Nenhum agendamento encontrado.</div>`;
    return;
  }

  const sMap  = { pending: 'st-pending', confirmed: 'st-confirmed', done: 'st-done', cancelled: 'st-cancelled' };
  const sLabel = { pending: 'Pendente', confirmed: 'Confirmado', done: 'Concluído', cancelled: 'Cancelado' };

  el.innerHTML = list.map(b => {
    const [y, m, d] = b.date.split('-');
    const mon = MONTHS[parseInt(m) - 1].slice(0, 3).toUpperCase();
    const acts =
      b.status === 'pending'
        ? `<button class="bk-btn bb-ok"     onclick="setStatus('${b.id}','confirmed')">✓ Confirmar</button><button class="bk-btn bb-cancel" onclick="setStatus('${b.id}','cancelled')">✗ Cancelar</button>`
        : b.status === 'confirmed'
          ? `<button class="bk-btn bb-done"   onclick="setStatus('${b.id}','done')">✓ Concluir</button><button class="bk-btn bb-cancel" onclick="setStatus('${b.id}','cancelled')">✗ Cancelar</button>`
          : `<button class="bk-btn bb-del" onclick="delBooking('${b.id}')">🗑</button>`;

    return `
      <div class="bk-card">
        <div class="bk-date"><div class="bk-day">${d}</div><div class="bk-mon">${mon}</div></div>
        <div class="bk-info">
          <div class="bk-name">${b.name}</div>
          <div class="bk-meta">📱 ${b.phone}${b.email ? ' · ' + b.email : ''}<br>🕐 ${b.time}${b.notes ? ' · <em>' + b.notes + '</em>' : ''}</div>
          <span class="bk-svc-tag">${b.serviceIcon} ${b.service}${b.price ? ' · ' + b.price : ''}</span>
          <div class="bk-code">${b.id}</div>
        </div>
        <div class="bk-actions"><span class="bk-badge ${sMap[b.status]}">${sLabel[b.status]}</span>${acts}</div>
      </div>`;
  }).join('');
}

async function setStatus(id, status) {
  const all = await dbLoad();
  const i   = all.findIndex(b => b.id === id);
  if (i >= 0) { all[i].status = status; await dbSave(all); }
  renderAdmFull();
}

async function delBooking(id) {
  if (!confirm('Excluir este agendamento definitivamente?')) return;
  const all = await dbLoad();
  await dbSave(all.filter(b => b.id !== id));
  renderAdmFull();
}

function setFilt(f, btn) {
  admFilt = f;
  document.querySelectorAll('.af-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAdm();
}

// ── Scroll & Mobile Nav ──────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', scrollY > 20);
});

const ham  = document.getElementById('hamburger');
const navL = document.getElementById('navLinks');
ham.addEventListener('click', () => navL.classList.toggle('open'));
navL.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navL.classList.remove('open')));

// ── Intersection Observer (reveal) ───────────────────────────
const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Init ─────────────────────────────────────────────────────
initSvcs();
drawCal();