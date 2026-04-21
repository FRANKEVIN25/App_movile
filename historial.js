// ── HISTORIAL (localStorage) ───────────────────────────────
const HIST_KEY = 'tiendita_historial';

function getHistorial() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY)) || []; }
  catch { return []; }
}

function archivarDiaActual() {
  const t = getTotals();
  if (t.count === 0) return;
  const today = new Date().toISOString().split('T')[0];
  const records = getHistorial();
  const idx = records.findIndex(r => r.date === today);
  const rec = {
    date: today,
    total: t.totalVenta,
    ganancia: t.ganancia,
    count: t.count,
    avg: t.avg,
    products: t.rows.map(r => ({ name: r.name, qty: r.qty, pv: r.pv, subtotal: r.sv, ganancia: r.ganancia }))
  };
  if (idx >= 0) records[idx] = rec;
  else records.unshift(rec);
  localStorage.setItem(HIST_KEY, JSON.stringify(records));
}

function renderHistorial() {
  const records = getHistorial();
  const wrap = document.getElementById('historial-list');

  if (!records.length) {
    document.getElementById('hist-summary').style.display = 'none';
    wrap.innerHTML = `<div class="hist-empty"><div class="h-icon">📅</div><p>Sin historial aún</p><small>Registra ventas y presiona "Nuevo Día"</small></div>`;
    return;
  }

  document.getElementById('hist-summary').style.display = 'flex';
  const totalGen = records.reduce((s, r) => s + r.total, 0);
  const mejorDia = records.reduce((b, r) => r.total > b.total ? r : b, records[0]);
  document.getElementById('hist-total-general').textContent = 'S/. ' + totalGen.toFixed(2);
  document.getElementById('hist-dias').textContent = records.length;
  document.getElementById('hist-mejor').textContent = fechaCorta(mejorDia.date) + ' · S/. ' + mejorDia.total.toFixed(2);

  wrap.innerHTML = records.map((r, i) => `
    <div class="hist-row" onclick="verDetalleDia(${i})">
      <div class="hist-date-badge">
        <div class="hist-day">${r.date.split('-')[2]}</div>
        <div class="hist-mon">${getNombreMes(r.date)}</div>
      </div>
      <div class="hist-info">
        <div class="hist-total">S/. ${r.total.toFixed(2)}</div>
        <div class="hist-sub">${r.count} unid. · Gan. <span style="color:var(--success)">S/. ${r.ganancia.toFixed(2)}</span></div>
      </div>
      <div class="hist-arrow">›</div>
    </div>`).join('');
}

function verDetalleDia(i) {
  const r = getHistorial()[i];
  if (!r) return;
  document.getElementById('dd-fecha').textContent = fechaLarga(r.date);
  document.getElementById('dd-total').textContent = 'S/. ' + r.total.toFixed(2);
  document.getElementById('dd-ganancia').textContent = 'S/. ' + r.ganancia.toFixed(2);
  document.getElementById('dd-count').textContent = r.count + ' unidades vendidas';
  document.getElementById('dd-tabla').innerHTML = r.products.map(p => `
    <tr>
      <td>${esc(p.name)}</td>
      <td class="td-num">${p.qty}</td>
      <td class="td-num td-blue">S/. ${p.subtotal.toFixed(2)}</td>
      <td class="td-num td-green">+S/. ${p.ganancia.toFixed(2)}</td>
    </tr>`).join('');
  openModal('modal-detalle-dia');
}

function getNombreMes(dateStr) {
  const m = parseInt(dateStr.split('-')[1]) - 1;
  return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][m];
}
function fechaCorta(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}
function fechaLarga(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
